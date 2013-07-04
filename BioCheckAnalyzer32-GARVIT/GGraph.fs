﻿////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2013  Microsoft Corporation
//
//  Module Name:
//
//      GGraph.fs
//
//  Abstract:
//
//      Set of useful graph algorithms
//
//  Contact:
//
//      Garvit Juniwal (garvitjuniwal@eecs.berkeley.edu)
//
//  Notes:
//      This file implements the following algorithms over directed graphs
//      1. Tarjan's SCC Decomposition
//      2. Weak Topological Ordering using heirarchical Tarjan's SCC decomposition
//      3. Recursive Iteration Strategy based on WTOs

module GGraph

open System.Collections.Generic

/// type for a graph
/// every vertex must have a different label
type Graph<'label> = {    
    numNodes : int;
    vertices : Map<int, 'label>;
    edges : Set<int * int>
    }

/// return empty graph of specified type of vertices
let Empty<'label> = { 
    numNodes= 0;
    vertices= Map.empty<int, 'label>; 
    edges= Set.empty<int * int> 
    }

let AddVertex vertex graph =
    { graph with numNodes = graph.numNodes+1; vertices = Map.add graph.numNodes vertex graph.vertices }
    

let GetVertexId label graph =
    // get the internal number of a vertex from its label
    // raises KeyNotFoundException in case the label does not exist
    Map.findKey (fun _ lbl -> lbl = label) graph.vertices

let AddEdge src tgt graph= 
    let (s,t) =  try 
                    ((GetVertexId src graph), (GetVertexId tgt graph)) 
                  with 
                     | exn -> failwithf "Vertex %A or %A not found while adding edge" src tgt
                  in
        { graph with edges= Set.add (s,t) graph.edges } 


let CreateDotFile (fname:string) graph = 
    // open file
    let dot = new System.IO.StreamWriter(fname)
    // write header
    Printf.fprintf dot "digraph Lemmas {\n" 

    // write vertices
    Map.iter 
        (fun idx data -> Printf.fprintf dot "%d [shape=box,fontname=\"Consolas\",label=\"%A\"]\n" idx data)
        graph.vertices

    // write edges
    Set.iter (fun (src, dest) -> Printf.fprintf dot "%d -> %d\n" src dest) graph.edges
        
    // write footer
    Printf.fprintf dot "}\n"
    // close file
    dot.Dispose ()
    dot.Close ()



/// Return the adjacency list of the graph
let GetAdjacencyList graph =
    Set.fold (fun map (s,t) -> 
                   Map.add s (t::map.[s]) map
                   )
        (Map.fold (fun map vertex _ ->
                    Map.add vertex [] map)
                Map.empty
                graph.vertices)
        graph.edges



/// Tarjan's SCC Decomposition from Wikipedia
let GetSCCDecomposition graph =
    let sccList = new List<List<'label>>()


    let index = ref 0
    let dfsStack = new Stack<int>()

    let depthIndex = Array.create graph.numNodes -1  //depth of -1 means depth is undefined
    let lowLink = Array.create graph.numNodes -1 
     
    let succ = GetAdjacencyList graph

    let rec strongConnect vertex =
        begin
            depthIndex.[vertex] <- !index
            lowLink.[vertex] <- !index
            index := !index + 1
            dfsStack.Push(vertex)

            for successor in succ.[vertex] do
                if depthIndex.[successor] = -1 then
                    strongConnect successor
                    lowLink.[vertex] <- min lowLink.[vertex] lowLink.[successor]
                elif dfsStack.Contains(successor) then
                    lowLink.[vertex] <- min lowLink.[vertex] depthIndex.[successor]
            
            if lowLink.[vertex] = depthIndex.[vertex] then
                let scc = new List<'label>()

                let mutable loopCondition = true
                while loopCondition do
                    let w = dfsStack.Pop()
                    scc.Add(graph.vertices.[w])
                    loopCondition <- not(w=vertex)

                sccList.Add(scc)
        end

    for KeyValue(idx,_) in graph.vertices do
        if depthIndex.[idx] = -1 then
            strongConnect idx

    sccList


/// Each component is either a terminal or a list of components
type Component<'label> = 
    | Term of 'label
    | NonTerm of Component<'label> list

/// Weak Topological Order from 
/// Efficient chaotic iteration strategies with widenings : Francois Bourdoncle
/// this implementation uses a lot of mutable data
/// to understand refer to the paper 
let GetWeakTopologicalOrder graph =

    let index = ref 0
    let dfsStack = new Stack<int>()

    let depthIndex = Array.create graph.numNodes 0 
    let succ = GetAdjacencyList graph


    let rec VisitComponent vertex =
        let mutable partition = (NonTerm [])
        for successor in succ.[vertex] do
            if depthIndex.[successor] = 0 then
                let (_, rpartition) = (Visit successor partition)
                partition <- rpartition
        (match partition with
                | Term(lbl) -> failwith "partition should have been a list"
                | NonTerm(lst) -> NonTerm(Term(graph.vertices.[vertex]) :: lst)
                )

    and Visit vertex partition=
        dfsStack.Push(vertex)
        incr index
        depthIndex.[vertex] <- !index
        let mutable head = depthIndex.[vertex]
        let mutable loop = false
        let mutable min = System.Int32.MaxValue
        let mutable retPartition = partition

        for successor in succ.[vertex] do
            if depthIndex.[successor]  = 0 then
                let (rmin, rretPartition) = (Visit successor retPartition)
                min <- rmin
                retPartition <- rretPartition
            else
                min <- depthIndex.[successor]

            if min <= head then
                head <- min
                loop <- true

        if head = depthIndex.[vertex] then
            depthIndex.[vertex] <- System.Int32.MaxValue
            let mutable element = dfsStack.Pop()
            
           
            if loop then
                while not (element = vertex) do
                    depthIndex.[element] <- 0
                    element <- dfsStack.Pop()
                
                let mutable p = NonTerm []
                retPartition <- (match retPartition with
                                    | Term(lbl) -> failwith "partition should have been a list"
                                    | NonTerm(lst) -> NonTerm((VisitComponent vertex):: lst)
                                    )
            else 
                retPartition <- (match retPartition with
                                    | Term(lbl) -> failwith "partition should have been a list"
                                    | NonTerm(lst) -> NonTerm(Term(graph.vertices.[vertex]) :: lst)
                                    )
        (head, retPartition)

    let mutable partition = NonTerm []
    for KeyValue(vertex, label) in graph.vertices do
        if depthIndex.[vertex] = 0 then
            let (_, rpartition) = (Visit vertex partition)
            partition <- rpartition
    partition



type Strategy<'label> = {
    next : 'label option;
    exit : 'label option;
    isHead : bool
    }

/// create the recursive strategy from a wto as described in 
/// Efficient chaotic iteration strategies with widenings : Francois Bourdoncle
/// returns a Map<'label, Strategy<'label>
/// strategy has a next field which denote the next vertex in order
/// and a exit field which has Some value only for the vertices which are heads
/// it denotes the next vertex in order after that component (of which it is the head) reaches a fp
/// isHead is true iff the vertex is the head of some component
/// exit is non-None only when isHead is true

/// example: 1 [ 2 [ 3 4 ] ] ] 5 would return
/// 1.next = 2,    1.exit = None, 1.isHead = false
/// 2.next = 3,    2.exit = 5,    2.isHead = true
/// 3.next = 4,    3.exit = 2,    3.isHead = true
/// 4.next = 3,    4.exit = None, 4.isHead = false 
/// 5.next = None, 5.exit = None, 5.isHead = false
let GetRecursiveStrategy graph =
    let wto = GetWeakTopologicalOrder graph

    /// loopBack is true iff this list of components is closed within another component 
    /// In other words, loopBack is false only when we start with the outermost list when it is not
    /// a compnent in itself. For eg. in case of [1 [ 2 3 ] ] loopBack will be true and 
    /// for 1 [ 2 3 ] loopBack will be false
    let rec CreateStrategy (compLst : Component<'label> list) (loopBack : bool) =
        let head = 
            match compLst with
                | Term(lbl) :: rest -> lbl
                | _ -> failwith "Component must have a head"

        ((List.foldBack 
            (fun subcomp (stgyMap, prev) ->
                // stgyMap contains the strategy map constructed so far and prev stores the vertex next in order in the WTO
                // if this subComp is a terminal, then its next field should point to prev
                // if this subComp is a non-terminal, then the exit field of head of subComp would be prev
                match subcomp with
                    | Term(lbl) -> (Map.add lbl { next= prev; exit= None; isHead = (lbl=head) && loopBack } stgyMap, Some lbl)
                    | NonTerm(lst) ->   let (subStgyMap, subHead) = (CreateStrategy lst true)
                                        // combine the maps stgyMap and subStgyMap
                                        // replace the exit field of the head of the subComp to point to prev
                                        (Util.MergeMaps stgyMap subStgyMap
                                            |> Map.add subHead { subStgyMap.[subHead] with exit = prev}, 
                                          Some subHead)
            )
            compLst
            (Map.empty, if loopBack then Some head else None)) |> fst,
            head)

    match wto with
        | Term(lbl) -> failwith "WTO cannot be a terminal"
        | NonTerm(hd::tl) -> match hd with
                                | Term(lbl) ->  let (strategy, head) = CreateStrategy (hd::tl) false
                                                (strategy, Some head)
                                | NonTerm(lst) -> let (strategy, head) = CreateStrategy lst true
                                                  (strategy, Some head)
        | NonTerm [] -> Map.empty, None
(*
let testGraph1 = Empty<string> |> AddVertex "Alice" |> AddVertex "Bob" |> AddVertex "Charlie" |> AddEdge "Alice" "Bob" |>
                    AddEdge "Bob" "Alice" |> AddEdge "Bob" "Charlie"
let testGraph2 = Empty<int> |> AddVertex 11 |> AddVertex 12 |> AddVertex 13 |> AddVertex 14 |> 
                    AddVertex 15 |> AddVertex 16 |> AddVertex 17 |> AddVertex 18|> AddEdge 11 12 |> 
                        AddEdge 12 13 |> AddEdge 13 14 |> AddEdge 14 15 |> AddEdge 15 16 |> AddEdge 16 17 |>
                            AddEdge 17 18 |> AddEdge 12 18 |> AddEdge 14 17 |> AddEdge 16 15 |> AddEdge 17 13
*)