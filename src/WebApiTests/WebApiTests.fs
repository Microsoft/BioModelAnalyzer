﻿module ``Deployment Tests`` 
    
open NUnit.Framework
open FsCheck
open System.IO
open FSharp.Collections.ParallelSeq
open System.Diagnostics
open Newtonsoft.Json.Linq
open LTLTests

let urlApi = "http://localhost:8223/api/"
let urlLra = sprintf "%slra" urlApi
//let urlApi = "http://bmamathnew.cloudapp.net/api/"
//let urlLra = "http://bmamathnew.cloudapp.net/api/lra"

let appId = "CF1B2F01-E2B7-4D34-88B6-9C9078C0D637"

let isSucceeded jobId =
    let respCode, resp = Http.get (sprintf "%s/%s?jobId=%s" urlLra appId jobId) "text/plain"
    match respCode with
    | 200 -> true
    | 201 | 202 -> false
    | 203 -> failwithf "Job failed: %A" resp
    | 404 -> failwith "There is no job with the given job id and application id"
    | code -> failwithf "Unknown response code when getting status: %d" code
    

let perform job = 
    let jobId = (Http.postJsonFile (sprintf "%s/%s" urlLra appId) job |> snd).Trim('"')
    while isSucceeded jobId |> not do
        System.Threading.Thread.Sleep(1000)
    
    let respCode, resp = Http.get (sprintf "%s/%s/result?jobId=%s" urlLra appId jobId) "application/json; charset=utf-8"
    match respCode with
    | 200 -> resp
    | 404 -> failwith "There is no job with the given job id and application id"
    | code -> failwithf "Unknown response code when getting status: %d" code

let performSR endpoint job =
    let code, result = Http.postJsonFile (sprintf "%s%s" urlApi endpoint) job
    match code with
    | 200 -> result
    | 204 -> raise (System.TimeoutException("Timeout while waiting for job to complete"))
    | _ -> failwithf "Unexpected http status code %d" code

let performShortPolarity = performSR "AnalyzeLTLPolarity"
let performLTLSimulation = performSR "AnalyzeLTLSimulation"
let performSimulation = performSR "Simulate"
let performAnalysis = performSR "Analyze"
let performFurtherTesting = performSR "FurtherTesting"


[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Long-running LTL polarity checks``() =
    checkJob Folders.LTLQueries perform comparePolarityResults ""

[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Short-running LTL polarity checks``() =
    checkSomeJobs performShortPolarity comparePolarityResults "" ["LTLQueries/toymodel.request.json"]

[<Test; ExpectedException(typeof<System.TimeoutException>)>]
[<Category("Deployment")>]
let ``Short LTL polarity causes timeout if the check takes too long``() =
    performShortPolarity "LTLQueries/Epi-V9.request.json" |> ignore

[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Simulate LTL``() =
    checkSomeJobs performLTLSimulation compareLTLSimulationResults "" ["LTLQueries/toymodel.request.json"]

[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Simulate model``() =
    checkJob Folders.Simulation performSimulation compareSimulationResults ""
    
[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Analyze model``() =
    checkJob Folders.Analysis performAnalysis compareAnalysisResults ""
    
[<Test; Timeout(600000)>]
[<Category("Deployment")>]
let ``Find counter examples for a model``() =
    checkJob Folders.CounterExamples performFurtherTesting compareFurtherTestingResults ""

[<Test>]
[<Category("Deployment")>]
let ``Check get status response format``() =
    let job = "LTLQueries/toymodel.request.json"

    let t0 = System.DateTimeOffset.Now

    let jobs = 
        Array.init 5 (fun n -> (Http.postJsonFile (sprintf "%s/%s" urlLra appId) job |> snd).Trim('"'))
        
    let jobId = jobs.[jobs.Length-1]

    let rec check (lastPos:int, lastElapsed:int) =
        let next arg = 
            System.Threading.Thread.Sleep(100)
            check arg

        let respCode, resp = Http.get (sprintf "%s/%s?jobId=%s" urlLra appId jobId) "application/json; charset=utf-8"
        match respCode with
        | 200 -> ()
        | 201 -> 
            Trace.WriteLine(sprintf "Queued: %s, expected <= %d" resp lastPos)
            let pos = int resp
            Assert.GreaterOrEqual(pos, 0, "Position is zero-based")
            Assert.LessOrEqual(pos, lastPos, "Position must not increase")
            next(pos, lastElapsed)
        | 202 ->         
            Trace.WriteLine(sprintf "Executing: %s, expected >= %d" resp lastElapsed)
            
            let json = JObject.Parse(resp)

            let started = System.DateTimeOffset.Parse(json.["started"].ToString())
            Assert.IsTrue(started > t0, "Start time")
            
            let elapsed = int (json.["elapsed"])
            Assert.Greater(elapsed, lastElapsed, "Elapsed")

            next(lastPos, elapsed)
        | 404 -> failwith "There is no job with the given job id and application id"
        | code -> failwithf "Unexpected response code when getting status: %d" code
    
    check(jobs.Length-1, 0)


[<Test>]
[<Category("Deployment")>]
let ``Check get failure status response format``() =
    let job = "incorrect.request.json"

    let jobId = (Http.postJsonFile (sprintf "%s/%s" urlLra appId) job |> snd).Trim('"')

    let rec check () =
        let next arg = 
            System.Threading.Thread.Sleep(100)
            check arg

        let respCode, resp = Http.get (sprintf "%s/%s?jobId=%s" urlLra appId jobId) "application/json; charset=utf-8"
        match respCode with
        | 203 -> 
            Trace.WriteLine("Ok, the job has failed: " + resp)
            StringAssert.Contains("Exception", resp)
        | 200 -> failwith "The job must fail"
        | 201 -> 
            Trace.WriteLine(sprintf "Queued: %s" resp)
            next()
        | 202 ->         
            Trace.WriteLine(sprintf "Executing: %s" resp)
            next()
        | 404 -> failwith "There is no job with the given job id and application id"
        | code -> failwithf "Unexpected response code when getting status: %d" code
    
    check ()
