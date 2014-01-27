﻿module Interface

open Physics
open Vector
open Automata

//open Microsoft.FSharp.Quotations
//open Microsoft.FSharp.Quotations.Typed
//open Microsoft.FSharp.Quotations.Raw

type particleModification = Death | Life of Particle*Map<QN.var,int> | Divide of (Particle*Map<QN.var,int>)*(Particle*Map<QN.var,int>)
type interfaceTopology = {name:string; regions:((Cuboid<um>* int* int) list); responses:((float<second>->Particle->Map<QN.var,int>->particleModification) list)}
type floatMetric = Radius | Pressure | Age | Confluence | Force
type limitMetric = RadiusLimit of float<Physics.um> | PressureLimit of float<Physics.zNewton Physics.um^-2> | AgeLimit of float<Physics.second> | ConfluenceLimit of int | ForceLimit of float<Physics.zNewton>

//type chance = Certain | Random of System.Random*float*float

let cbrt2 = 2.**(1./3.)
let rsqrt2 = 1./(2. ** 0.5)

let probabilisticMotor (min:int) (max:int) (state:int) (rng:System.Random) (force:float<zNewton>) (p:Particle) =
    //pMotor returns a force randomly depending on the state of the variable
    match rng.Next(min,max) with
    | x when x > state -> p.orientation*force
    | _ -> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>}

//let rlinearGrow (rate: float<um/second>) (max: float<um>) (varID: int) (varState: int) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match (m.[varID] = varState) with
//    | false -> p
//    | true ->
//            match (p.radius < max) with
//            | true -> {p with radius = p.radius+rate*dt} //Particle(p.id,p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze)
//            | false -> p

//let linearGrow (rate: float<um/second>) (max: float<um>) (varID: int) (varState: int) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match (m.[varID] = varState) with
//    | false -> Life (p,m)
//    | true ->
//            match (p.radius < max) with
//            | true -> Life ({p with radius = p.radius+rate*dt},m)//(Particle(p.id,p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze),m)
//            | false -> Life (p,m)

let limitedLinearGrow (rate: float<um/second>) (property: limitMetric) (varID: int) (varState: int) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    //Limit grow by an arbitrary property
    let overLimit = match property with
                                        | RadiusLimit(n)     -> (p.radius > n)
                                        | AgeLimit(n)        -> (p.age > n)
                                        | PressureLimit(n)   -> (p.pressure > n)
                                        | ForceLimit(n)      -> (p.forceMag > n)
                                        | ConfluenceLimit(n) -> (p.confluence > n)
    match (m.[varID] = varState, overLimit) with
    | (_,true)  -> Life (p,m)
    | (false,_) -> Life (p,m)
    | (true,_)  -> Life ({p with radius = p.radius+rate*dt},m)//(Particle(p.id,p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze),m)

//let linearGrowDivide (rate: float<um/second>) (max: float<um>) (varID: int) (varState: int) (rng: System.Random) (limit: limitMetric option) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match (m.[varID] = varState) with
//    | false -> Life (p,m)
//    | true ->
//            match (p.radius < max) with
//            | true -> Life ({p with radius = p.radius+rate*dt},m) //(Particle(p.id,p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze),m)
//            //Neighbouring division- no overlap
//            //| false -> Divide ((Particle(p.name,p.location+(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,p.age,(PRNG.gaussianMargalisPolar' rng),p.freeze),m),(Particle(p.name,p.location-(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m))
//            //Equally distributed overlap
//            | false ->
//                        let newR = (p.radius/(cbrt2))
//                        let overlap = 2.*newR-p.radius
//                        let posMod = newR - overlap/2.
//                        //Divide ((Particle(p.id,p.name,p.location+(p.orientation*(posMod)),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m),(Particle(gensym(),p.name,p.location-(p.orientation*(posMod)),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m))
//                        //Divide (({p with location = p.location+ p.orientation*(posMod); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m),({p with id = gensym(); location = p.location- p.orientation*(posMod); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m))
//                        Divide (({p with location = p.location+ p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m),({p with id = gensym(); location = p.location- p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m))
let linearGrowDivide (rate: float<um/second>) (max: float<um>) (sd: float<um>) (varID: int) (varState: int) (rng: System.Random) (limit: limitMetric option) (variation: bool) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    let max = if variation then max+sd*p.gRand else max
    match (m.[varID] = varState, limit) with
    | (false,_) -> Life (p,m) //Not in growth state
    | (true,None) ->
            match (p.radius < max) with
            | true -> Life ({p with radius = p.radius+rate*dt},m)// Growing if below limit  (Particle(p.id,p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze),m)
            | false -> Divide (({p with location = p.location+ p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m),({p with id = gensym(); location = p.location- p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m))
    | (true,Some(l)) ->
            let overLimit = match l with
                                        | RadiusLimit(n)     -> (p.radius > n)
                                        | AgeLimit(n)        -> (p.age > n)
                                        | PressureLimit(n)   -> (p.pressure > n)
                                        | ForceLimit(n)      -> (p.forceMag > n)
                                        | ConfluenceLimit(n) -> (p.confluence > n)
            match ((p.radius < max), overLimit) with
            | (_,true) -> Life (p,m)
            | (true,_)  -> Life ({p with radius = p.radius+rate*dt},m)
            | (false,_) -> Divide (({p with location = p.location+ p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m),({p with id = gensym(); location = p.location- p.orientation*(p.radius/(cbrt2)); velocity = p.velocity*rsqrt2; radius = (p.radius/(cbrt2)); age = 0.<second>; gRand = PRNG.gaussianMargalisPolar' rng },m))

            
            //Divide ((Particle(p.id,p.name,p.location+(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m),(Particle(gensym(),p.name,p.location-(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m))

//let growDivide (rate: float<um/second>) (max: float<um>) (varID: int) (varState: int) (cha: chance) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) = 
//    let eMax = match cha with
//                | Certain -> max
//                | Random(rng,mean,sd) -> max+sd*(p.gRand*1.<um>)
//    match (m.[varID] = varState) with
//    | false -> Life (p,m)
//    | true ->
//            match (p.radius < eMax) with
//            | true -> Life (Particle(p.name,p.location,p.velocity,p.orientation,p.Friction,(p.radius+rate*dt),p.density,p.age,p.gRand,p.freeze),m)
//            | false -> Divide ((Particle(p.name,p.location+(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,p.age,(PRNG.gaussianMargalisPolar' rng),p.freeze),m),(Particle(p.name,p.location-(p.orientation*(p.radius/(cbrt2))),p.velocity*rsqrt2,p.orientation,p.Friction,(p.radius/(cbrt2)),p.density,0.<second>,(PRNG.gaussianMargalisPolar' rng),p.freeze),m))


let apoptosis (varID: int) (varState: int) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    //dt doesn't do anything here- this is an 'instant death' function
    match (m.[varID] = varState) with
    | false -> Life (p,m)
    | true -> Death
    // SI: consider switching to just if-then for these small expressions
    // if (m.[varID] = varState) then Death else Life (p,m)

let shrinkingApoptosis (varID: int) (varState: int) (minSize: float<Physics.um>) (shrinkRate: float<Physics.um second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    match (m.[varID] = varState, p.radius <= minSize) with
    | (false,_)    -> Life (p,m)
    | (true,false) -> Life ({p with radius=p.radius-shrinkRate*dt},m)
    | (true,true)  -> Death

let shrinkingRandomApoptosis (varID: int) (varState: int) (minSize: float<Physics.um>) (shrinkRate: float<Physics.um second^-1>) (rng: System.Random) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    match (m.[varID] = varState, rng.NextDouble() < probability*dt, p.radius <= minSize) with
    | (false,_,_)       -> Life (p,m)
    | (true,false,_)    -> Life (p,m)
    | (true,true,false) -> Life ({p with radius=p.radius-shrinkRate*dt},m)
    | (true,true,true)  -> Death

let shrinkingBiasRandomApoptosis (varID: int) (varState: int) (minSize: float<Physics.um>) (shrinkRate: float<Physics.um second^-1>) (bias:floatMetric) (rng: System.Random) (sizePower:float) (refC:float<'a>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    let biasMetric = match bias with
                        | Radius     -> float p.radius
                        | Age        -> float p.age
                        | Pressure   -> float p.pressure
                        | Force      -> float p.forceMag
                        | Confluence -> float p.confluence
    match (m.[varID] = varState, rng.NextDouble() < probability*dt*refM*((biasMetric-(float refC))**sizePower), p.radius <= minSize) with
    | (false,_,_)       -> Life (p,m)
    | (true,false,_)    -> Life (p,m)
    | (true,true,false) -> Life ({p with radius=p.radius-shrinkRate*dt},m)
    | (true,true,true)  -> Death

let certainDeath (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    Death

let randomApoptosis (varID: int) (varState: int) (rng: System.Random) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    //dt appropriately scales the probability with time
    match (m.[varID] = varState) with
    | false -> Life (p,m)
    | true -> match (rng.NextDouble() < probability*dt) with
                | true -> Death
                | false -> Life (p,m)

let randomBiasApoptosis (varID: int) (varState: int) (bias: floatMetric) (rng: System.Random) (sizePower:float) (refC:float<'a>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
    //cells have a higher chance of dying based on some metric- the power determines the precise relationship
    let biasMetric = match bias with
                        | Radius     -> float p.radius
                        | Age        -> float p.age
                        | Pressure   -> float p.pressure
                        | Force      -> float p.forceMag
                        | Confluence -> float p.confluence
    match (m.[varID] = varState) with
    | false -> Life (p,m)
    | true -> match (rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((biasMetric- (float refC) )**sizePower)) with
                | true -> Death
                | false -> Life (p,m)

//let randomSizeApoptosis (varID: int) (varState: int) (rng: System.Random) (sizePower:float) (refC:float<um>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    //cells have a higher chance of dying based on their size- the power determines the precise relationship
//    match (m.[varID] = varState) with
//    | false -> Life (p,m)
//    | true -> match (rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((1.<um^-1>*(p.radius-refC))**sizePower)) with
//                | true -> Death
//                | false -> Life (p,m)
//
//let randomAgeApoptosis (varID: int) (varState: int) (rng: System.Random) (sizePower:float) (refC:float<second>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    //cells have a higher chance of dying based on their age- the power determines the precise relationship
//    //(age is the time taken since the last division)
//    match (m.[varID] = varState) with
//    | false -> Life (p,m)
//    | true -> match (rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((1.<second^-1>*(p.age-refC))**sizePower)) with
//                | true -> Death
//                | false -> Life (p,m)
//
//let randomConfluenceApoptosis (varID: int) (varState: int) (rng: System.Random) (power:float) (refC:float) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match ((m.[varID] = varState),(rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((1.*((float)p.confluence-refC))**power))) with
//    | (false,_) -> Life (p,m)
//    | (true,false) -> Life (p,m)
//    | (true,true) -> Death
//
//let randomPressureApoptosis (varID: int) (varState: int) (rng: System.Random) (power:float) (refC:float<zNewton um^-2>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match ((m.[varID] = varState),(rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((1.<um^2/zNewton>*(p.pressure-refC))**power))) with
//    | (false,_) -> Life (p,m)
//    | (true,false) -> Life (p,m)
//    | (true,true) -> Death
//
//let randomForceApoptosis (varID: int) (varState: int) (rng: System.Random) (power:float) (refC:float<zNewton>) (refM:float) (probability: float<second^-1>) (dt: float<second>) (p: Particle) (m: Map<QN.var,int>) =
//    match ((m.[varID] = varState),(rng.NextDouble() < dt*probability+dt*1.<second^-1>*refM*((1.<1/zNewton>*(p.forceMag-refC))**power))) with
//    | (false,_) -> Life (p,m)
//    | (true,false) -> Life (p,m)
//    | (true,true) -> Death

// SI: consider consolidating nested matches like this:                     
//    match (m.[varID] = varState), (rng.NextDouble() < probability) with
//    | false, _     -> Life (p,m)
//    | true , true  -> Death
//    | true , false -> Life (p,m)

let rec dev (f : float<second>->Particle->Map<QN.var,int>->particleModification) (dT: float<second>) (pm: (Particle*Map<QN.var,int>) list) (acc: (Particle*Map<QN.var,int>) list) =
    match pm with
    | head::tail -> 
                    let (p,m) = head
                    match (f dT p m) with
                    | Death -> dev f dT tail acc
                    | Life(p1,m1) ->  dev f dT tail ((p1,m1)::acc)
                    | Divide((p1,m1),(p2,m2)) -> dev f dT tail ((p1,m1)::((p2,m2)::acc))
    | [] -> List.fold (fun acc elem -> elem::acc) [] acc //reverse the list which has been created by cons'ing

let rec devProcess (r : (float<second>->Particle->Map<QN.var,int>->particleModification) list) (dT:float<second>) (pm: (Particle*Map<QN.var,int>) list) = 
    match r with
    | head::tail -> devProcess tail dT (dev head dT pm [])
    | [] -> pm

let divideSystem system machineName =
//    let rec f (sys: Particle list) (accS: Particle list) (accM: Particle list) (name:string) =
//        match sys with
//        | head::tail when System.String.Equals(head.name,name) -> f tail accS head::accM name
//        | head::tail -> f tail head::accS accM name
//        | [] -> (accS,accM)
//     f system [] [] machineName
    let f (p: Particle) ((name:string),(accS: Particle list),(accM: Particle list)) =
        match System.String.Equals(p.name,name) with
        | true ->  (name,accS,p::accM)
        | false -> (name,p::accS,accM)
    let (n,s,m) = List.foldBack f system (machineName,[],[])
    (s,m)

let interfaceUpdate (system: Particle list) (machineStates: Map<QN.var,int> list) (dT:float<second>) (intTop:interfaceTopology)  =
    //let (name,regions,responses) = iTop
    let name = intTop.name
    let regions = intTop.regions
    let responses = intTop.responses
    //let (staticSystem,machineSystem) = divideSystem system name
    //let machineSystem = (List.filter (fun (p:Particle) -> not p.freeze) system)
    //let staticSystem  = (List.filter (fun (p:Particle) -> p.freeze) system)
    let (machineSystem,staticSystem) = List.partition (fun (p:Particle) -> not p.freeze) system
    (*
    Regions in the interface set a variable state of a machine based on the machines physical location. 
    If the machine is within a box, the variable is set to something unusual
    ie if I'm here, then I get a signals
    *)
    let withinCuboid (p: Particle) (c:Cuboid<um>) =
        let farCorner = c.origin+c.dimensions
        (p.location.x <= farCorner.x && p.location.y <= farCorner.y && p.location.z <= farCorner.z) && (p.location.x >= c.origin.x && p.location.y >= c.origin.y && p.location.z >= c.origin.z)
    let regionSwitch (r:Cuboid<um>*int*int) (p: Particle) (m: Map<QN.var,int>) =
        let (regionBox,vID,vState) = r
        match (withinCuboid p regionBox) with
        | true ->  m.Add(vID,vState)
        | false -> m
    let rec regionListSwitch (r: (Cuboid<um>*int*int) list) (p: Particle) (m: Map<QN.var,int>) =
        match r with
        | head::tail -> regionListSwitch tail p (regionSwitch head p m)
        | [] -> m


    let rec respond (r:  (float<second>->Particle->Map<QN.var,int>->Particle) list) (dT: float<second>) (p: Particle) (m: Map<QN.var,int>) =
        match r with
        | head::tail -> respond tail dT (head dT p m) m
        | [] -> p

    //let nmSystem = [for (p,m) in (List.zip machineSystem machineStates) -> respond responses dT p m]



    //How do you fix the problem of physicsI update first or machineI update first?
    //Do I need to pass *both* new and old machines?
    //No, I'm going to update the physics first. The only way this could change things is by dividing across a region- this is not unreasonable
    let pm = devProcess responses dT (List.zip machineSystem machineStates)
    let nMachineStates = [for (p,m) in pm -> regionListSwitch regions p m]
    let nmSystem = [for (p,m) in pm -> p]
    //let nSystem = List.foldBack (fun (p: Particle) acc -> p::acc) staticSystem nmSystem
    let nSystem = nmSystem @ staticSystem
    //let nMachineStates = machineStates
    //let machineForces = [for p in nSystem -> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>} ]
    let machineForces = List.map (fun x -> {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>}) nSystem
    //let machineForces = seq { for p in nSystem do yield {x=0.<zNewton>;y=0.<zNewton>;z=0.<zNewton>} }
    (nSystem, nMachineStates, machineForces)