// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
// Learn more about F# at http://fsharp.net
// See the 'F# Tutorial' project for more help.


[<EntryPoint>]
let main argv = 
    let inputs = [| 1;0 |]
    
    SystemSimulator.run Models.test_automata5_forms (Map.add "path" 0 Map.empty) ["path"] ["path"] inputs (SystemSimulator.default_params 3)

    printfn "%A" argv
    0 // return an integer exit code
