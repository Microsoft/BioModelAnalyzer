﻿////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2013  Microsoft Corporation
//
//  Module Name:
//
//      Prover.fs
//
//  Abstract:
//
//      Top level prover module to run the shrink-cut-merge method
//
//  Contact:
//
//      Garvit Juniwal (garvitjuniwal@eecs.berkeley.edu)
//

module Prover


open System

type CEX =
    | Bifurcation of Map<QN.var, int> * Map<QN.var, int>
    | Cycle of Map<QN.var, int> * int


/// starts simulation from the current point, returns 
/// Some (cyclestart, length) length can be 1
/// should never return (_,0)
/// should always terminate because the network is finite
let SimulateForCycle qn point =
    let mutable allEnvs = Map.add point 0 Map.empty
    let mutable env = point
    let mutable i = 0
    let mutable stop = false

    let mutable cycleData = (point, 0) /// this never be the return value, it will change when the loop terminates
    
    while not stop do
        if Log.level(2) then Log.log_debug (sprintf "Step: %d, Env %s" i (Expr.str_of_env env))
        env <- (Simulate.tick qn env)
        i <- i+1
        if allEnvs.ContainsKey env then /// found cycle
            if Log.level(1) then Log.log_debug (sprintf "Step %d, Back To %d, LOOP FOUND at %s" i allEnvs.[env] (Expr.str_of_env env))
            cycleData <- (env, i-allEnvs.[env])
            stop <- true
        else
            allEnvs <- Map.add env i allEnvs
    cycleData

let ProveStability (qn : QN.node list) =

    let timer = new System.Diagnostics.Stopwatch()
    timer.Start()

    let ranges = Map.ofList [for node in qn -> (node.var, node.range)]
    let inputs = Map.ofList [for node in qn -> (node.var, node.inputs)]


    let mutable outputs' = Map.ofList [for node in qn -> (node.var, Set.empty)]
    for node in qn do
        for input in node.inputs do
            let curr_outs = outputs'.[input]
            outputs' <- Map.add input (curr_outs.Add node.var) outputs'
    let outputs = outputs'


    let qnGraph =
        List.fold
            (fun graph (node : QN.node) ->
                List.fold
                    (fun graph input ->
                        GGraph.AddEdge input node.var graph)
                    graph
                    node.inputs)
            (List.fold
                    (fun graph (node : QN.node) ->
                    GGraph.AddVertex node.var graph)
                    GGraph.Empty<QN.var>
                    qn)
            qn

    let (qnStrategy, qnStartPoint) = 
            GGraph.GetRecursiveStrategy qnGraph
    
    if Log.level(1) then 
        let qnWTO = GGraph.GetWeakTopologicalOrder qnGraph
        Log.log_debug("WTO:" + GGraph.Stringify (qnWTO) string)


    let mutable initialBounds = 
        Map.ofList 
            (List.fold 
                (fun bb (n:QN.node) -> 
                    if (Expr.is_a_const ranges n.f) then 
                        let c = Expr.eval_expr n.var ranges n.f Map.empty
                        (n.var,(c,c)) :: bb
                    else (n.var, Map.find n.var ranges) :: bb)
                []
                qn)
    
    let mutable initialFrontier = 
        Set.ofList 
            (List.fold 
                (fun bb (n:QN.node) -> 
                    if (Expr.is_a_const ranges n.f) then bb
                    else n.var :: bb)
                []
                qn)
    
    
    if Log.level(1) then Log.log_debug("InitialBounds={" + (QN.str_of_range qn initialBounds) + "}")


    let rec FindStablePoints  frontier bounds =
        let shrunkBounds = Shrink.Shrink qn ranges inputs outputs qnStrategy qnStartPoint frontier bounds 
        
        if Map.forall (fun _ (lower,upper) -> upper = lower) shrunkBounds then
            let stablePoint = (Map.fold (fun map v (lower, _) -> Map.add v lower map) Map.empty shrunkBounds)
            let stablePoint' = (Simulate.tick qn stablePoint)
            if stablePoint' = stablePoint then
                if Log.level(1) then Log.log_debug(sprintf "Found Stable Point %s" (Expr.str_of_env stablePoint))
                (Some stablePoint, None)
            else 
                if Log.level(1) then Log.log_debug(sprintf "Found fake Stable Point %s" (Expr.str_of_env stablePoint'))
                (None, None)

        else 
            if Log.level(1) then Log.log_debug("Trying to cut.. ")
            let (cutNode, cutAt, cutNature) = Cut.FindBestCut qn ranges shrunkBounds
            let cutNodeVar = cutNode.var
            if Log.level(1) then Log.log_debug (sprintf "CutNode %d, CutPoint %d, CutNature %A" cutNodeVar cutAt cutNature)

            let newFrontier = (Map.find cutNodeVar outputs)
            
            if Log.level(1) then Log.log_debug("Entering first half..")
            let (stablePoint1, cex1) = FindStablePoints newFrontier (Map.add cutNodeVar ((fst shrunkBounds.[cutNodeVar]), cutAt) shrunkBounds) 
            if Option.isSome cex1 then 
                (None, cex1)
            else 
                if Log.level(1) then Log.log_debug("Entering second half..")
                let (stablePoint2, cex2) = FindStablePoints newFrontier (Map.add cutNodeVar (cutAt+1, (snd shrunkBounds.[cutNodeVar]))shrunkBounds) 
                if Option.isSome cex2 then 
                    (None, cex2)
                else
                    if Log.level(1) then Log.log_debug("Trying to merge two halves, since no cex found..")
                    let OneWayResult =
                        match (stablePoint1, stablePoint2) with
                        |(Some a, Some b) -> (None, Some (Bifurcation(a,b)))
                        |(Some a, None) -> (Some a, None)
                        |(None, Some a) -> (Some a, None)
                        | _ -> (None, None)
                                

                    if cutNature <> Cut.TwoWay then
                        OneWayResult
                    else
                        if Log.level(1) then Log.log_debug("Trying to find cycles across two way cut..")
                        let cycle =
                            (FNewLemmas.all_inputs [for node in qn -> if node.var = cutNode.var then (node.var, (cutAt, cutAt+1)) else (node.var, bounds.[node.var])])
                            |> Seq.map (fun point -> (SimulateForCycle qn point))
                            |> Seq.tryFind (fun cycleData -> match cycleData with 
                                                                | (_, 0) -> failwith "Bad lenght of cycle returned"
                                                                | (_, 1) -> false
                                                                | _ -> true)
                        match cycle with
                        | Some c -> (None, Some (Cycle(c)))
                        | None -> OneWayResult
                  
    
    printfn "Elapsed time before calling shrink is %i" timer.ElapsedMilliseconds

    let initialShrunkBounds = Shrink.Shrink qn ranges inputs outputs qnStrategy qnStartPoint initialFrontier initialBounds

    printfn "Elapsed time after calling shrink the first time is %i" timer.ElapsedMilliseconds

    let results =
        if Map.forall (fun _ (lower,upper) -> upper = lower) initialShrunkBounds then
            (Some ((Map.fold (fun map v (lower, _) -> Map.add v lower map) Map.empty initialShrunkBounds)), None)
        else
            if Log.level(1) then Log.log_debug "Trying to find bifurcation.."
            let z_bifur = Z.find_bifurcation qn initialShrunkBounds

            let bifur = 
                match z_bifur with
                | Some((fix1, fix2)) -> Some (Bifurcation((Z.fixpoint_to_env fix1), (Z.fixpoint_to_env fix2)))
                | None -> None
                
            //printfn "Elapsed time after trying to find bifurcation is %i" timer.ElapsedMilliseconds

            if Option.isNone bifur then 
                if Log.level(1) then Log.log_debug "No bifurcation found. Will now attempt to cut."
                FindStablePoints Set.empty initialShrunkBounds 
            else
                (None, bifur)
           
          
    printfn "Elapsed time until finish is %i" timer.ElapsedMilliseconds
    results