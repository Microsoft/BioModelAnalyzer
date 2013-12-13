﻿module Physics

open Vector
(*
Some back of the envelope calculations to make it all easier
E.coli has a mass of 0.5 picograms
It is roughly cylindical with a height of 2 micrometers and a diameter of 0.5 micrometers
Therefore its volume is 2 * 0.25 * 0.25 * pi = 0.39 micrometers^3
Therefore the density is 1.3 picogram micrometer^-3

From wiki: 'some achieve roughly 60 cell lengths / second'

Therefore we might expect coli's top speed to me 120 um / s

Newton is Kg m s^-2

In a Brownian dynamics scheme (no inertia), with a friction coefficient of 1 s^-1 we need

V = fric / mass * F
F = V * mass / fric
F = 120 um s^-1 * 0.5 pg * fric s^-1
  = 60 um pg s^-2
  = 60 * 10^-6 m * 10^-15 kg s^-2
  = 60 * 10^-21 m Kg s^-2
  = 60 zepto N (10^-21)

This seems low so we need a good guess for the friction coefficient...

From Berry et al the flagellar motor causes linear movement of velocity 200 um / s and a force of 15 pN (Theories of Rotary Motors, 2000, Philo Trans R Soc Lond B)

Working with the BD integrator, it appears that 5 x 10^-9 <second> is  accurate for a 0.5 pg sphere experiencing a force of 15 pN

This works because

F= 15pN = 15*10^9zN

r(t+dt) = F * dT / gamma (+ noise)

gamma = 0.5/X pg second^-1

160 um = 15*10^9 zN * 1 second / gamma

160 um = 15*10^9 pg um second^-2 * 1 second * X second / 0.5 pg

Clear up the units

160 um = 15*10^9 * X /0.5 um

X = 80 * 10^-9 /15 = 5 * 10^-9 s

It also indicates that femto-pico Newtons may be typical for cellular systems
*)

[<Measure>]
type um

[<Measure>]
type second

[<Measure>]
type pg

[<Measure>]
type Kelvin

[<Measure>]
type zNewton = pg um second^-2 //F=ma zeptonewtons because pg um second^-2 = 10^-15 kg 10^-6 m second^-2


//[<Measure>]
//type FricCoeff = pg second^-1 //Friction coeffs for Brownian dynamics (AMU/ps in gromacs). v = 1/amu * F + noise. AMU is atomic mass unit(!)

//[<Measure>]
//type FricCon = second // g/s, so to calculate multiply mass by FricConstant

(*
Boltzmann constant is 
1.38 * 10^-23 m^2  kg second^-2 K^-1

1 kg = 10 ^ 15 pg 

1.38 * 10^-8 m^2  pg second^-2 K^-1

1 m ^ 2 = 10^12 um^2

1.38 * 10^4   um^2 pg second^-2 K^-1
*)
let Kb = (1.3806488 * 10.**4. )*1.<um^2 pg second^-2 Kelvin^-1>

let gensym =
    let x = ref 0
    (fun () -> incr x; !x)

type Particle = { id:int; name:string; location:Vector3D<um>; velocity:Vector3D<um second^-1>; orientation: Vector3D<1>; Friction: float<second>; radius: float<um>; density: float<pg um^-3>; age: float<second>; pressure: Lazy<float<zNewton um^-2>>; forceMag: Lazy<float<zNewton>>; confluence: Lazy<int>; gRand:float; freeze: bool} with
    //member this.name = Name
    //member this.id = id
    //member this.location = R
    //member this.velocity = V
    //member this.orientation = O
    //member this.Friction = Friction
    member this.volume = 4. / 3. * System.Math.PI * this.radius * this.radius * this.radius //Ugly
    //member this.radius = radius
    //member this.density = density
    member this.mass = this.volume * this.density
    member this.frictioncoeff = this.mass / this.Friction
    //member this.freeze = freeze
    //member this.age = age
    //member this.gRand = GaussianRandomNumber
    member this.ToString = sprintf "%d %s %f %f %f %f %f %f %f %f %f %f %f %f %f %f %b" this.id this.name (this.location.x*1.<um^-1>) (this.location.y*1.<um^-1>) (this.location.z*1.<um^-1>) (this.velocity.x*1.<second um^-1>) (this.velocity.y*1.<second um^-1>) (this.velocity.z*1.<second um^-1>) (this.orientation.x) (this.orientation.y) (this.orientation.z) (this.Friction*1.<second^-1>) (this.radius*1.<um^-1>) (this.density*1.<um^3/pg>) (this.age*1.<second^-1>) (this.gRand) this.freeze

let defaultParticle = { id=0;
                        name="X";
                        location={x=0.<um>;y=0.<um>;z=0.<um>};
                        velocity={x=0.<um/second>;y=0.<um/second>;z=0.<um/second>};
                        orientation={x=1.;y=0.;z=0.};
                        Friction=1.<second>;
                        radius=0.<um>;
                        density=1.<pg/um^3>;
                        age=0.<second>;
                        pressure= Lazy(fun () -> 0.<zNewton um^-2>);
                        forceMag= Lazy(fun () -> 0.<zNewton>);
                        confluence= Lazy(fun () -> 0);
                        gRand=0.;
                        freeze=true}
(*
SI: implement Particle as a record. then can write update more concisely.
type part = { id:int; Name:string; loc:int } 

let p = { id=0; Name="s"; loc=32 } 
let p' = { p with loc = p.loc + 1 } 
*)

let noForce (p1: Particle) (p2: Particle) = 
    {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>} 

let thermalReorientation (T: float<Kelvin>) (rng: System.Random) (dT: float<second>) (cluster: Particle) =
//    let rNum = PRNG.nGaussianRandomMP rng 0. 1. 6
//    let FrictionDrag = 0.5/cluster.frictioncoeff //Friction drag halves because we split the particle into two
//    let tA =  sqrt (2. * T * FrictionDrag * Kb * dT) * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)}
//    let tB =  sqrt (2. * T * FrictionDrag * Kb * dT) * { x= (List.nth rNum 3) ; y= (List.nth rNum 4); z= (List.nth rNum 5)}
    let rNum = PRNG.nGaussianRandomMP rng 0. 1. 3
    let FrictionDrag = 1./cluster.frictioncoeff 
    let tV =  sqrt (2. * T * FrictionDrag * Kb * dT) * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)}
    (cluster.orientation*cluster.radius+tV).norm


let harmonicBondForce (optimum: float<um>) (forceConstant: float<zNewton>) (p1: Particle) (p2: Particle) =
    let ivec  = (p1.location - p2.location)
    let displacement = ivec.len - optimum
    forceConstant * displacement * (p1.location - p2.location).norm

let softSphereForce (repelPower: float) (repelConstant: float<zNewton>) ( attractPower:float ) (attractConstant: float<zNewton>) (attractCutOff: float<um>) (p1: Particle) (p2: Particle) =
    //Not as hard as a typical hard sphere force (n^-13, where n is less than 1)
    //Repulsion now scales with a power of the absolute distance overlap
    let ivec = (p1.location - p2.location)
    let mindist = p1.radius + p2.radius
    match ivec.len with 
    | d when d > (attractCutOff+mindist) -> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>}
    | d when d > mindist -> attractConstant * ((ivec.len - mindist)*1.<um^-1>)**attractPower * (p1.location - p2.location).norm
    | _ -> repelConstant * ((ivec.len-mindist)*1.<um^-1>)**repelPower * (p1.location - p2.location).norm

//let hardSphereForce (forcePower: float) (forceConstant: float<zNewton> ) (p1: Particle) (p2: Particle) =
//    //the force felt by p2 due to collisions with p1 (relative distances)
//    let ivec = (p1.location - p2.location)
//    let mindist = p1.radius + p2.radius
//    match ivec.len with 
//    | d when mindist <= d -> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>}
//    | _ -> forceConstant * (-1./(ivec.len/mindist)**(forcePower)-1.) * (p1.location - p2.location).norm

let hardSphereForce (repelForcePower: float) (repelConstant: float<zNewton> ) ( attractPower:float ) (attractConstant: float<zNewton>) (attractCutOff: float<um>) (p1: Particle) (p2: Particle) =
    //'Hard' spheres repel based on a (normalised overlap ** -n) Originally meant to be similar to lennard-jones potentials
    //the force felt by p2 due to collisions with p1 (relative distances), or harmonic adhesion (absolute distances)
    let ivec = (p1.location - p2.location)
    let mindist = p1.radius + p2.radius
    match ivec.len with 
    | d when d > (attractCutOff+mindist)-> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>} //can't see one another
    | d when d > mindist -> attractConstant * ((ivec.len - mindist)*1.<um^-1>)**attractPower * (p1.location - p2.location).norm
    | _ -> repelConstant * (-1./(ivec.len/mindist)**(repelForcePower)-1.) * (p1.location - p2.location).norm //overlapping

let rec gridFill (system: Particle list) (acc: Map<int*int*int,Particle list>) (minLoc:Vector3D<um>) (cutOff:float<um>) =
        match system with
        | head:: tail -> 
                            let dx = int ((head.location.x-minLoc.x)/cutOff)
                            let dy = int ((head.location.y-minLoc.y)/cutOff)
                            let dz = int ((head.location.z-minLoc.z)/cutOff)
                            let newValue = match acc.ContainsKey (dx,dy,dz) with
                                            | true  -> head::acc.[(dx,dy,dz)]
                                            | false -> [head]
                            
                            gridFill tail (acc.Add((dx,dy,dz),newValue)) minLoc cutOff
        | [] -> acc

let existingNeighbourCells (box: int*int*int) (grid: Map<int*int*int,Particle list>) =
        let (x,y,z) = box
        [for i in [0..2] do
                            for j in [0..2] do
                                                for k in [0..2] do
                                                                    match grid.ContainsKey(x-1+i,y-1+j,z-1+k) with
                                                                    | false -> ()
                                                                    | true  -> yield grid.[x-1+i,y-1+j,z-1+k] ]

let collectGridNeighbours (p: Particle) (grid: Map<int*int*int,Particle list>) (minLoc:Vector3D<um>) (cutOff:float<um>) =
         let everythingButThis (p: Particle) (l: Particle list) =
            [for i in l do
                            match i.id=p.id with
                            | true -> ()
                            | false -> yield i ]
         let rec quickJoin (l1: Particle list) (l2: Particle list) =
            match l2 with
            | head::tail -> quickJoin (head::l1) tail
            | [] -> l1
         let rec quickJoinLoL (l: Particle list list) acc =
            match l with
            | head::tail -> quickJoinLoL tail (quickJoin acc head)
            | [] -> acc
         let dx = int ((p.location.x-minLoc.x)/cutOff)
         let dy = int ((p.location.y-minLoc.y)/cutOff)
         let dz = int ((p.location.z-minLoc.z)/cutOff)
         
         everythingButThis p (quickJoinLoL (existingNeighbourCells (dx,dy,dz) grid) [] )

let gridNonBondedPairList (system: Particle list) (cutOff: float<um>) minLoc = 
    //Create a grid using the cutoff as a box size
    //let (minLoc,maxLoc) = vecMinMax ([for p in system->p.location]) ((List.nth system 0).location,(List.nth system 0).location

    let grid = gridFill system Map.empty minLoc cutOff

//    let g = [for i in system -> 
//                                let dx = int ((i.location.x-minLoc.x)/cutOff)
//                                let dy = int ((i.location.y-minLoc.y)/cutOff)
//                                let dz = int ((i.location.z-minLoc.z)/cutOff)
//                                grid.[dx,dy,dz] ]
    [for i in system -> collectGridNeighbours i (gridFill system Map.empty minLoc cutOff)]

let rec updateGrid (accGrid: Map<int*int*int,Particle list>) sOrigin (mobileSystem: Particle list) (cutOff: float<um>) = 
    match mobileSystem with
    | head :: tail -> 
                            let dx = int ((head.location.x-sOrigin.x)/cutOff)
                            let dy = int ((head.location.y-sOrigin.y)/cutOff)
                            let dz = int ((head.location.z-sOrigin.z)/cutOff)
                            let newValue = match accGrid.ContainsKey (dx,dy,dz) with
                                            | true  -> head::accGrid.[(dx,dy,dz)]
                                            | false -> [head]
                            updateGrid (accGrid.Add((dx,dy,dz),newValue)) sOrigin tail cutOff

    | [] -> accGrid

let nonBondedPairList (system: Particle list) (cutOff: float<um>) = 
    let getNeighbours (p:Particle) (system: Particle list) (cutOff: float<um>) =
        match p.freeze with
        | false -> [for i in system do match (i.location-p.location).len with
                                        | x when i=p -> ()
                                        | x when x < cutOff-> yield i
                                        | _ -> () ]
        | true -> [] //don't calculate the forces on frozen particles- they don't respond/move
    [for i in system -> getNeighbours i system cutOff] 

type forceEnv = { force: Vector.Vector3D<zNewton>; confluence: Lazy<int>; absForceMag: Lazy<float<zNewton>>; pressure: Lazy<float<zNewton um^-2>> }
// SI:: use more specific names than head, tail.
//      | top_particlar:: other_particles -> ... 
let forceUpdate (topology: Map<string,Map<string,Particle->Particle->Vector3D<zNewton>>>) (cutOff: float<um>) (system: Particle list) staticGrid sOrigin (externalF: Vector3D<zNewton> list) = 
    let rec sumForces (p: Particle) (neighbours: Particle list) (acc: Vector.Vector3D<zNewton>) =
        match neighbours with
        | first_p::other_p -> sumForces p other_p (topology.[p.name].[first_p.name] first_p p) + acc
        | [] -> acc
    let sphereIntersectionArea (p:Particle) (first_p:Particle) = 
        let d = (first_p.location - p.location).len
        let intersectionRadiusSq = 1./(4.*d*d) * (-d + p.radius - first_p.radius) * (-d - p.radius + first_p.radius) * (-d + p.radius + first_p.radius) * (d + p.radius + first_p.radius)  
        2.*System.Math.PI* intersectionRadiusSq
    let rec populateForceEnvironment (p: Particle) (neighbours: Particle list) (acc: forceEnv) =
        match neighbours with
        | first_p::other_p ->   let f = topology.[p.name].[first_p.name] first_p p
                                let d = (first_p.location - p.location).len
                                let fMag = f.len
                                //let intersectionRadiusSq = 1./(4.*d*d) * (-d + p.radius - first_p.radius) * (-d - p.radius + first_p.radius) * (-d + p.radius + first_p.radius) * (d + p.radius + first_p.radius)  
                                //(p.radius*p.radius  - (1./(4.*d*d)) * (d*d - first_p.radius*first_p.radius + p.radius*p.radius)* (d*d - first_p.radius*first_p.radius + p.radius*p.radius))
                                //let intersectionArea = 2.*System.Math.PI* intersectionRadiusSq
                                populateForceEnvironment p other_p {acc with 
                                                                        force = acc.force + f; 
                                                                        confluence = if (fMag>0.<zNewton> && not first_p.freeze) then lazy (acc.confluence.Value+1) else acc.confluence ; 
                                                                        absForceMag = lazy (acc.absForceMag.Value + fMag);
                                                                        //eqn for an intersection of two spheres radius = 1/2d * sqrt(4*d**2.*p1.radius - (d**2. - p2.radius**2. + p1.radius**2.)**2.)
                                                                        //therefore area =  2 * pi * (p1.radius - 1/4d**2.* (d**2. - p2.radius**2. + p1.radius**2.)**2.)
                                                                        pressure = if (d > (p.radius + first_p.radius)) then acc.pressure else lazy (acc.pressure.Value + fMag/(sphereIntersectionArea p first_p))
                                                                        }
//                                acc.force <- acc.force + f
//                                acc.confluence <- acc.confluence + 1
//                                acc.absForceMag <- acc.absForceMag + abs(f.len)
//                                acc.pressure <- if ((p.location - first_p.location).len > (p.radius + first_p.radius)) then acc.pressure else acc.pressure + abs(f.len)/intersectionArea
//                                populateForceEnvironment p other_p acc
        | [] -> acc
    //add all the mobile particles to the staticGrid
    let mobileSystem = (List.filter (fun (p:Particle) -> not p.freeze) system)
    let nonBondedGrid = updateGrid staticGrid sOrigin mobileSystem cutOff
    let nonBonded = List.map (fun (p: Particle) -> if p.freeze then [] else (collectGridNeighbours p nonBondedGrid sOrigin cutOff)) system
    (*
    This is expensive and only does one thing. We want to have it do a few other cheap things on the way.
    The first version sums the vectors on a particle
    I want it to calculate 4 related things
    The sum of the vector forces on a particle; the number of forces on a particle (confluence); the sum of the absolute scalar forces on a particle; the sum of the pressures
    My first approach will be to use a record accumulator
    *) 
    let forceDescriptors = List.map (fun x -> { force = x ; confluence=Lazy.Create(fun ()->0) ; absForceMag = Lazy.Create(fun ()->0.<zNewton>); pressure= Lazy.Create(fun ()-> 0.<zNewton um^-2>)  }) externalF
    //List.map3 (fun x y z ->  sumForces x y z) system nonBonded externalF  
    List.map3 (fun x y z ->  populateForceEnvironment x y z) system nonBonded forceDescriptors  

let bdAtomicUpdateNoThermal (cluster: Particle) (F: Vector.Vector3D<zNewton>) T (dT: float<second>) rng (maxMove: float<um>) = 
    let FrictionDrag = 1./cluster.frictioncoeff
    let NewV = FrictionDrag * F
    // SI: use V' style rather than NewV
    // let V' = FrictionDrag * F
    let NewP = dT * NewV + cluster.location
    //Particle(cluster.id,cluster.name, NewP,NewV,cluster.orientation,cluster.Friction, cluster.radius, cluster.density, cluster.age+dT, cluster.gRand, false)
    { cluster with location = NewP; velocity=NewV; age=cluster.age+dT }


let bdAtomicUpdate (cluster: Particle) (F: Vector.Vector3D<zNewton>) (T: float<Kelvin>) (dT: float<second>) (rng: System.Random) (maxMove: float<um>)= 
    let rNum = PRNG.nGaussianRandomMP rng 0. 1. 3
    let FrictionDrag = 1./cluster.frictioncoeff
    //let ThermalV =  2. * Kb * T * dT * FrictionDrag * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)} //instantanous velocity from thermal motion
    let NewV = FrictionDrag * F //+ T * FrictionDrag * Kb
    let ThermalP = sqrt (2. * T * FrictionDrag * Kb * dT) * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)}  //integral of velocities over the time
    let NewP = dT * FrictionDrag * F + cluster.location + ThermalP
    //let NewV = NewP * (1. / dT)
    //printfn "Force %A %A %A" F.x F.y F.z
    //Particle(cluster.id,cluster.name, NewP,NewV,cluster.orientation,cluster.Friction, cluster.radius, cluster.density, cluster.age+dT, cluster.gRand, false)
    { cluster with location = NewP; velocity=NewV; age=cluster.age+dT }

let bdOrientedAtomicUpdate (cluster: Particle) (F: forceEnv) (T: float<Kelvin>) (dT: float<second>) (rng: System.Random) (maxMove: float<um>) = 
    let rNum = PRNG.nGaussianRandomMP rng 0. 1. 3
    let FrictionDrag = 1./cluster.frictioncoeff
    //let ThermalV =  2. * Kb * T * dT * FrictionDrag * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)} //instantanous velocity from thermal motion
    let NewV = FrictionDrag * F.force //+ T * FrictionDrag * Kb
    let ThermalP = sqrt (2. * T * FrictionDrag * Kb * dT) * { x= (List.nth rNum 0) ; y= (List.nth rNum 1); z= (List.nth rNum 2)}  //integral of velocities over the time
    let dP = dT * FrictionDrag * F.force + ThermalP
    //How can you ensure that the timestep is appropriate? This will breakdown for motor cells
//    let safety = match (dP.len>maxMove) with
//                    | true  -> 
//                                printfn "Particle %s at %A moves %A, length %A" cluster.name cluster.location dP dP.len
//                                printfn "Thermal %A" ThermalP.len
//                                printfn "Force %A" (dT * FrictionDrag * F).len
//                                failwith "Max move violated. Timestep possibly too large"
//                    | false -> ()
//    //assert (dP.len < 0.5<um>) //Ensure that motions are small
    let NewP = cluster.location + dP

    let NewO = thermalReorientation T rng dT cluster
    //Particle(cluster.id,cluster.name, NewP,NewV,NewO,cluster.Friction, cluster.radius, cluster.density, cluster.age+dT, cluster.gRand, false)
    { cluster with location = NewP; velocity=NewV; orientation=NewO; age=cluster.age+dT ; pressure=F.pressure; forceMag=F.absForceMag ; confluence=F.confluence}

let bdSystemUpdate (system: Particle list) (forces: forceEnv list) atomicIntegrator (T: float<Kelvin>) (dT: float<second>) (rng: System.Random) (maxMove: float<um>) =
    List.map2 (fun (p:Particle) (f:forceEnv) -> if p.freeze then p else (atomicIntegrator p f T dT rng maxMove) ) system forces

let steep (system: Particle list) (forceEnv: forceEnv list) (maxlength: float<um>) = 
    let forces = List.map (fun x->x.force) forceEnv
    let (minV,maxV) = vecMinMax forces ((List.nth forces 0),(List.nth forces 0))
    let modifier = maxlength/maxV.len
    (*
    match (modifier=infinity*1.0<um/zNewton>) with
    | true ->  system
    | false -> 
            [for (p,f) in (List.zip system forces) -> match p.freeze with 
                                                        | false -> Particle(p.id,p.name,(p.location+(f*modifier)),p.velocity,p.orientation,p.Friction, p.radius, p.density, p.age, p.gRand, p.freeze)
                                                        | true -> p ]
                                                        *)
    if (modifier=infinity*1.0<um/zNewton>) then system
    else 
      [for (p,f) in (List.zip system forces) -> 
        if p.freeze then p 
        //else Particle(p.id,p.name,(p.location+(f*modifier)),p.velocity,p.orientation,p.Friction, p.radius, p.density, p.age, p.gRand, p.freeze)]
        else {p with location = p.location+(f*modifier)} ]

let rec integrate (system: Particle list) topology staticGrid sOrigin (machineForces: Vector.Vector3D<zNewton> list) (T: float<Kelvin>) (dT: float<second>) maxMove (vdt_depth: int) (nbCutOff:float<um>) steps rand = 
    let F = forceUpdate topology nbCutOff system staticGrid sOrigin machineForces
    //let F = List.map (fun x -> x.force) Fenv
    //From the update, calculate if the maximum move is broken
    let system' = bdSystemUpdate system F bdOrientedAtomicUpdate T dT rand maxMove
    let maxdP   = List.map2 (fun (s: Particle) (s': Particle) -> (s'.location - s.location).len) system system'
                    |> List.max
    //system'
    match ((maxdP < maxMove),(steps=1),(vdt_depth>0)) with
    | (true,true,_)  -> system'
    | (true,false,_) -> integrate system' topology staticGrid sOrigin machineForces T dT maxMove vdt_depth nbCutOff (steps-1) rand //in a single call we shouldn't exceed maxmove, even if done in parts
    | (false,_,true) -> //Maximum move is broken, but we have some variable dT depth left. Halve the timestep, double the steps, reduce the depth by 1 and repeat
                        //printf "Dropping down... NewDepth = %A " (vdt_depth-1) 
                        integrate system topology staticGrid sOrigin machineForces T (dT/2.) maxMove (vdt_depth-1) nbCutOff (steps*2) rand
    | (false,_,false) -> //Maximum move is broken, and we have run out of variable dT depth. Fail and exit
                        printf "Max: %A Limit: %A Depth: %A" maxdP maxMove vdt_depth
                        failwith "Max move violated and run out of variable timestep depth. Reduce the timestep or increase the depth of the variability"