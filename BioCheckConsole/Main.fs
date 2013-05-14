﻿(* Copyright (c) Microsoft Corporation. All rights reserved. *)
module Main

// Implementations of:
// Cook, Fisher, Krepska, Piterman; Proving stabilization of biological systems; VMCAI 2011.
// Claessen, Fisher, Ishtiaq, Piterman, Wang; Model-Checking Signal Transduction Networks through Decreasing Reachability Sets; CAV 2013.
open System.Xml
open System.Xml.Linq

type Engine = EngineCAV | EngineVMCAI | EngineSimulate
let engine_of_string s = 
    match s with 
    | "CAV" | "cav" -> Some EngineCAV
    | "VMCAI" | "vmcai" -> Some EngineVMCAI 
    | "Simulate" | "simulate" -> Some EngineSimulate
    | _ -> None 

// Command-line args
let engine = ref None 
let model  = ref "" // input model filename 
// -- VMCAI
let proof_output = ref "" // output filename 
// -- CAV
let formula = ref "True"
let number_of_steps = ref -1
let naive_computation = ref false
let model_check = ref false
let modelsdir = ref "C:\\Users\\np183\\tools\\BioCheckPlus\\BioCheck\\xml Models"
let output_model = ref false
let output_proof = ref false
// -- Simulate
let simul_v0     = ref "" // initial values file (csv file, with idXvalue schema)
let simul_time   = ref 20 // max time to simulate
let simul_output = ref "" // output log/excel filename. 

let run_tests = ref false 
let logging = ref false 

let rec parse_args args = 
    match args with 
    | "-model" :: m :: rest -> model := m; parse_args rest
    | "-engine" :: e :: rest -> engine := engine_of_string e; parse_args rest
    | "-prove" :: o :: rest -> proof_output := o; parse_args rest 
    | "-simulate" :: o :: rest -> simul_output := o; parse_args rest 
    | "-simulate_time" :: t :: rest -> simul_time := (int)t; parse_args rest
    | "-simulate_v0" :: v0 :: rest -> simul_v0 := v0; parse_args rest
    | "-formula" :: f :: rest -> formula := f; parse_args rest
    | "-mc" :: rest -> model_check := true; parse_args rest
    | "-outputmodel" :: rest -> output_model := true; parse_args rest
    | "-naive" :: rest -> naive_computation := true; parse_args rest
    | "-proof" :: rest -> output_proof := true; parse_args rest
    | "-path" :: i :: rest -> number_of_steps := (int)i; parse_args rest
    | "-modelsdir" :: d :: rest -> modelsdir := d; parse_args rest
    | "-tests" :: rest -> run_tests := true; parse_args rest
    | "-log" :: rest -> logging := true; parse_args rest
    | _ -> failwith "Bad command line args" 

//type IA = BioCheckAnalyzerCommon.IAnalyzer2
//let analyzer = UIMain.Analyzer2()

[<EntryPoint>]
let main args = 
    let res = ref 0
    
    parse_args (List.ofArray args)

    if !logging then Log.register_log_service(Log.AnalyzerLogService())   

    // Run VMCAI engine
    if (!model <> "" && !engine = Some EngineVMCAI &&
        !proof_output <> "") then    
        Log.log_debug "Running the proof"
        let model = XDocument.Load(!model) |> Marshal.model_of_xml
        let (sr,cex_o) = Stabilize.stabilization_prover model
        match (sr,cex_o) with 
        | (Result.SRStabilizing(_), None) -> 
            let stable_res_xml = Marshal.xml_of_stability_result sr
            stable_res_xml.Save(!proof_output)
        | (Result.SRNotStabilizing(_), Some(cex)) -> 
            let unstable_res_xml = Marshal.xml_of_stability_result sr
            unstable_res_xml.Save(!proof_output)
            let cex_xml = Marshal.xml_of_cex_result cex
            let filename,ext = System.IO.Path.GetFileNameWithoutExtension !proof_output, System.IO.Path.GetExtension !proof_output
            cex_xml.Save(filename + "_cex." + ext)
        | _ -> failwith "bad results from stabilization_prover"

    // Run CAV engine
    elif (!model <> "" && !engine = Some EngineCAV) then 
            // Negate the formula if needed
            let ltl_formula_str = 
                if (!model_check) then
                    sprintf "(Not %s)" !formula
                else
                    !formula
            let length_of_path = !number_of_steps // SI: only used once, just use !num_of_steps in change_list below? 

            let network = Marshal.model_of_xml(XDocument.Load(!modelsdir + "\\" + !model))
        
            let ltl_formula = LTL.string_to_LTL_formula ltl_formula_str network 

            LTL.print_in_order ltl_formula
            if (ltl_formula = LTL.Error) then
                ignore(LTL.unable_to_parse_formula)
            else             
                // Convert the interval based range to a list based range
                let nuRangel = Rangelist.nuRangel network

                // find out the path with decreasing size, 
                // and the initial value of steps to be unrolled
                // Paths is the list of ranges
                // initK = the length of prefix + the length of loop, which is used as the initial value of K when doing BMC
                let paths = Paths.output_paths network nuRangel !naive_computation

                if (!output_proof && not !naive_computation) then
                    Paths.print_paths network paths

                // Extend/truncate the list of paths to the required length
                // If the list of paths is shorter than needed repeat the last element 
                // If the list of paths is longer than needed remove the prefix of the list
                let correct_length_paths = Paths.change_list_to_length paths length_of_path
    
                // given the # of steps and the path, do BMC   
                let (res,model) =
                    BMC.BoundedMC ltl_formula network nuRangel correct_length_paths

                BioCheckPlusZ3.check_model model res network
                BioCheckPlusZ3.print_model model res network !output_model

    // Run Simulation engine
    elif (!model <> "" && !engine = Some EngineSimulate &&
          !simul_output <> "") then 
        Log.log_debug "Running the simulation"
        let qn = Marshal.model_of_xml (XDocument.Load !model)
        let init_values = 
            if (!simul_v0 <> "" && System.IO.File.Exists !simul_v0) then 
                let csv = System.IO.File.ReadAllLines !simul_v0 
                Array.fold (fun m (l:string) -> let ss = l.Split(',') in  Map.add ((int)ss.[0]) ((int)ss.[1]) m) Map.empty csv
            else List.fold (fun m (n:QN.node) -> Map.add n.var 0 m) Map.empty qn
        Log.log_debug (sprintf "time:%d init_values:[%s]" !simul_time (QN.str_of_env init_values))
        // SI: should check that dom(init_values) is complete wrt qn. 
        assert (QN.env_complete_wrt_qn qn init_values) 
        let final_values = Seq.toList (Simulate.simulate_many qn init_values !simul_time )
        Log.log_debug "Writing simulation log"
        let everything = String.concat "\n" (List.map (fun m -> Map.fold (fun s k v -> s + ";" + (string)k + "," + (string)v) "" m) final_values)
        System.IO.File.WriteAllText(!simul_output, everything)
        // SI: check why the xlsx is sometimes corrupted ? 
        let (app,sheet) = ModelToExcel.model_to_excel qn !simul_time init_values
        Log.log_debug "Writing excel spreadsheet"
        ModelToExcel.saveSpreadsheet app sheet (!simul_output + ".xlsx")

    // Run tests.     
    elif (!run_tests) then 
    //    UnitTests.register_tests2 (analyzer)
        Expr.register_tests()
        Test.run_tests ()

    // Incorrect flags. 
    if ((!model = "" && !engine = None) && !run_tests = false) then  
        Printf.printfn "Please provide an input model, and prove or simulate output."
        res := -1

    !res


