﻿module IO

open System.IO
open Physics
open Vector
open System.Xml.Linq

(*
'Spherical E. coli' particle
Particle({x=0.<um>;y=0.<um>;z=0.<um>},{x=0.<um/second>;y=0.<um/second>;z=0.<um/second>}, 0.00002<second>, 0.7<um>, 1.3<pg um^-3>, false)
*)

let dropFrame (system: Physics.Particle list) =
    ()

let cart2Particle ((name:string), (xr:float), (yr:float), (zr:float)) = 
    Particle(name,{x=(xr*1.<um>);y=(yr*1.<um>);z=(zr*1.<um>)},{x=0.<um/second>;y=0.<um/second>;z=0.<um/second>}, 1.<second>, 1.<um>, 1.<pg um^-3>, true)

let xyzWriteFrame (filename: string) (system: Physics.Particle list) =
        use file = new StreamWriter(filename, true)
        file.WriteLine(sprintf "%A" system.Length)
        file.WriteLine("Athene")
        //[for p in system -> printfn "%A %A %A %A" 1 p.location.x p.location.y p.location.z]
        ignore [for p in system -> file.WriteLine(sprintf "%s %A %A %A" p.name p.location.x p.location.y p.location.z)]
        file.Close()

let pdbRead (filename: string) =
    let atomParse (line: string) = 
        let name =    (line.Substring (11,5)).Trim()
        let x = float (line.Substring (30,8))
        let y = float (line.Substring (38,8))
        let z = float (line.Substring (46,8))
        cart2Particle (name, x,y,z)
    [for line in File.ReadLines(filename) do match line with
                                                            | atom when atom.StartsWith("ATOM") -> yield atomParse line
                                                            | _ -> () ]

let xmlTopRead (filename: string) =
    let xn s = XName.Get(s)
    let xd = XDocument.Load(filename)
    let pTypes = [ for t in xd.Element(xn "Topology").Element(xn "Types").Elements(xn "Particle") do 
                    let tName = try t.Attribute(xn "Name").Value with _ -> failwith "Cannot read name"
                    let tDensity = try (float) (t.Element(xn "Density").Value) with _ -> failwith "Cannot read density"
                    let tFric = try (float) (t.Element(xn "FrictionCoeff").Value) with _ -> failwith "Cannot read friction coefficient"
                    let tRadius = try (float) (t.Element(xn "Radius").Value) with _ -> failwith "Cannot read radius"
                    let tFreeze = match (t.Element(xn "Freeze").Value) with
                                  | "true" -> true
                                  | "false" -> false
                                  | _ -> failwith "Cannot read freeze"
                    yield Particle(tName,{x=0.<um>;y=0.<um>;z=0.<um>},{x=0.<um/second>;y=0.<um/second>;z=0.<um/second>},tFric*1.<second>, tRadius*1.<um>, tDensity*1.<pg um^-3>, tFreeze) ]
    let nbTypes = [ for bi in xd.Element(xn "Topology").Element(xn "NonBonded").Elements(xn "Interaction") do
                    let biName = try bi.Attribute(xn "Name").Value with _ -> failwith "Cannot read type"
                    let biMap =  [ for bj in bi.Elements(xn "jInteraction") do 
                                    let bjName = try bj.Attribute(xn "Name").Value with _ -> failwith "Cannot read type"
                                    //let bond = try (int) (bj.Element(xn "Type").Value) with _ -> failwith "Missing bond type"
                                    let bond = match (try (int) (bj.Element(xn "Type").Value) with _ -> failwith "Missing bond type") with
                                                |0 -> noForce
                                                |1 -> 
                                                    let rC = try (float) (bj.Element(xn "RepelConstant").Value) with _ -> failwith "Missing repel constant"
                                                    hardSphereForce (rC*1.<zNewton>)
                                                |2 ->
                                                    let rC = try (float) (bj.Element(xn "RepelConstant").Value) with _ -> failwith "Missing repel constant"
                                                    let aC = try (float) (bj.Element(xn "AttractConstant").Value) with _ -> failwith "Missing attract constant"
                                                    let aCO = try (float) (bj.Element(xn "AttractCutoff").Value) with _ -> failwith "Missing attract cutoff"
                                                    hardStickySphereForce (rC*1.<zNewton>) (aC*1.<zNewton/um>) (aCO*1.<um>)
                                                |_ -> failwith "Incorrect type of nonbonded interaction"
                                    yield (bjName,bond) ] 
                                    |> Map.ofList
                    yield (biName,biMap)
                        ]
                    |> Map.ofList
                         

                    //let bi = try b.Element(xn "i").Value with _ -> failwith "Incomplete type"
                    //let bj = try b.Element(xn "j").Value with _ -> failwith "Incomplete type"
                    //let bType = try (int) (b.Element(xn "Type").Value) with _ -> failwith "Missing bond type"
//                    let bond = match bType with
//                                |0 -> noForce
//                                |1 -> 
//                                    let rC = try (float) (b.Element(xn "RepelConstant").Value) with _ -> failwith "Missing repel constant"
//                                    hardSphereForce (rC*1.<zNewton>)
//                                |2 ->
//                                    let rC = try (float) (b.Element(xn "RepelConstant").Value) with _ -> failwith "Missing repel constant"
//                                    let aC = try (float) (b.Element(xn "AttractConstant").Value) with _ -> failwith "Missing attract constant"
//                                    let aCO = try (float) (b.Element(xn "AttractCutoff").Value) with _ -> failwith "Missing attract cutoff"
//                                    hardStickySphereForce (rC*1.<zNewton>) (aC*1.<zNewton/um>) (aCO*1.<um>)
//                                |_ -> failwith "Incorrect type of nonbonded interaction"
//                    yield (bi,bj,bond) ]
                    //|> Map.ofList
    (pTypes,nbTypes)
    
let topRead (filename: string) =
    //topology files describe the basic forces in the system
    //They are csvs in sections with the following format
    //System,Nonbonded cutoff, nlupdate
    //Types,name,frictioncoeff,radius,density,freeze
    //NonBonded,name,name,type,a,b,c,d
    //  ->where a,b,c and d are parameters for the energy function
    //Tissues,name,particles,bonds,bondtype
    //Contents,name,number
//    let lineParse (line:string) =
//        let elements = (line.Split[|','|])
//        match Array.get elements 0 with 
//        | "System"    -> ()
//        | "Type"      -> Particle((Array.get elements 1),{x=0.<um>;y=0.<um>;z=0.<um>},{x=0.<um/second>;y=0.<um/second>;z=0.<um/second>}, (float (Array.get elements 2) ) *1.<second>, (float (Array.get elements 3) ) *1.<um>, (float (Array.get elements 4) ) *1.<pg um^-3>, (bool (Array.get elements 5)))
//        | "NonBonded" -> ()
//        | "Tissues"   -> ()
//        | _ -> ()
//        ()
//    let Bdict = Map
//    let AddFuncToDict (a: string) (b: string) F (D : Map) =
//        let LocalMap = Map (b, F) 
//        D.Add (a,LocalMap)
//    let Bonds = (Physics.hardSphereForce, Physics.hardStickySphereForce)
    let PTypes = [for item in File.ReadLines(filename) do match (item.Split[|','|]) with 
                                                                | elements when (Array.get elements 0) = "Type" -> yield Particle((Array.get elements 1),{x=0.<um>;y=0.<um>;z=0.<um>},{x=0.<um/second>;y=0.<um/second>;z=0.<um/second>}, (float (Array.get elements 2) ) *1.<second>, (float (Array.get elements 3) ) *1.<um>, (float (Array.get elements 4) ) *1.<pg um^-3>, (System.String.Equals((Array.get elements 5),"true")))
                                                                | _ -> ()
                                                                ]
//    let BTypes = [for item in File.ReadLines(filename) do match (item.Split[|','|]) with 
//                                                                | elements when (Array.get elements 0) = "NonBonded" -> yield match (int (Array.get elements 1)) with
//                                                                                                                                | 0 -> Physics.hardSphereForce ((float (Array.get elements 5))*1.0<aNewton>)
//                                                                                                                                | 1 -> Physics.hardStickySphereForce ((float (Array.get elements 5))*1.0<aNewton>) ((float (Array.get elements 5))*1.0<aNewton/um>) ((float (Array.get elements 5))*1.0<um>)
//                                                                                                                                | _ -> failwith "Bad NonBonded Topology"
//                                                                | _ -> () ]
    PTypes