﻿// Learn more about F# at http://fsharp.net
// See the 'F# Tutorial' project for more help.
open System
open System.Drawing
open System.Windows.Forms
open Microsoft.FSharp.Collections
open Automata

let show_automata (a : Automata<_,_>) = 
    let form = new Form(ClientSize=Size(800, 600))
    let gviewer = new Microsoft.Msagl.GraphViewerGdi.GViewer()
    let graph = new Microsoft.Msagl.Drawing.Graph()
    a.Graph(graph) |> ignore
    gviewer.Graph <- graph
    gviewer.Dock <- DockStyle.Fill
    form.Controls.Add(gviewer)
    
    do Application.Run(form)


[<EntryPoint>]
let main argv = 
    let show_intermediate_steps = false
    let bound = 1
    
    //Set input high
    let b = Map.add "input" 1 Map.empty
    
    let simstep rely = 
        //Simulate
        let sim = Simulator.test_automata4 rely
        if show_intermediate_steps then show_automata sim
        //Remove the bits not involved in interference
        let sim_smaller = compressedMapAutomata(sim, fun m -> Map.add "neighbour_path" (fst m).["path"] b)
        if show_intermediate_steps then show_automata sim_smaller
        //Introduces Bounded asynchony
        let sim_BA = new BoundedAutomata<int,Simulator.interp> (bound, sim_smaller)
        if show_intermediate_steps then show_automata sim_BA
        //Compress
        compressedMapAutomata(sim_BA, fun m -> m)

    let finalsimstep rely = 
        //Simulate
        let sim = Simulator.test_automata3 rely
        //Remove the bits not involved in interference
        compressedMapAutomata(sim, fun m -> Map.add "neighbour_path" ((rely.value (snd m)).["neighbour_path"]) ((fst m).Remove("signal")))
        
    //The universal rely
    let a = new SimpleAutomata<Simulator.interp>()
    for i = 1 to 4 do
        for j = 1 to 4 do
            a.addInitialState i
            a.addState(i,Map.add "neighbour_path" i b)
            a.addEdge(i,j)
    
    //show_automata a

    let step1 = simstep a

    show_automata step1

    let step2 = simstep step1

    show_automata step2

    let finalstep = finalsimstep step2

    show_automata finalstep


    (*
    let t1 = Simulator.test_automata3 a

    show_automata t1
    
    let t2 = compressedMapAutomata(t1, fun m -> Map.add "neighbour_path" (fst m).["path"] b)

    show_automata t2

    let t2 = new BoundedAutomata<int,Simulator.interp> (1,t2)

    show_automata t2

    let t2 = compressedMapAutomata(t2, fun m -> m)

    show_automata t2
    

    let t3 = Simulator.test_automata3 t2

    show_automata t3
    *)

    printfn "%A" argv
    0 // return an integer exit code
