﻿using BioCheckAnalyzerCommon;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Linq;
using System.Xml.Serialization;

namespace bma.client.Controllers
{
    public class SimulateController : ApiController
    {
        // POST api/Analyze
        public SimulationOutput Post([FromBody]SimulationInput input)
        {
            input.Model.ReplaceVariableNamesWithIDs();
            input.Model.NullifyDefaultFunction();

            var log = new DefaultLogService();

            try {
                var xmlSerializer = new XmlSerializer(typeof(AnalysisInput));
                var ai = new AnalysisInput
                {
                    Cells = input.Model.Cells,
                     Variables = input.Model.Variables,
                     Relationships = input.Model.Relationships
                };
                var stream = new MemoryStream();
                xmlSerializer.Serialize(stream, ai);
                stream.Position = 0;
                var inputXml = XDocument.Load(stream);

                IAnalyzer2 analyzer = new UIMain.Analyzer2();

                var analyisStartTime = DateTime.Now;

                if (input.EnableLogging)
                {
                    analyzer.LoggingOn(log);
                }
                else
                {
                    analyzer.LoggingOff();
                    log.LogDebug("Enable Logging from the Run Proof button context menu to see more detailed logging info.");
                }

                var inputDictionary = new Dictionary<int, int>();

                foreach (var variable in input.Variables)
                {
                    inputDictionary.Add(variable.Id, (int)variable.Value);
                }

                var outputDictionary = analyzer.simulate_tick(inputXml, inputDictionary);

                return new SimulationOutput
                {
                    Variables = outputDictionary.Select(pair => new SimulationVariable {
                        Id = pair.Key,
                        Value = pair.Value
                    }).ToArray(),
                    ErrorMessages = log.ErrorMessages.Count > 0 ? log.ErrorMessages.ToArray() : null,
                    DebugMessages = log.DebugMessages.Count > 0 ? log.DebugMessages.ToArray() : null,
                };

                //outputData.ErrorMessages = log.ErrorMessages;
                //outputData.ZippedLog = ZipHelper.Zip(string.Join(Environment.NewLine, log.DebugMessages));
            }
            catch (Exception ex)
            {
                log.LogError(ex.ToString());
                return new SimulationOutput
                {
                    ErrorMessages = log.ErrorMessages.Count > 0 ? log.ErrorMessages.ToArray() : null,
                    DebugMessages = log.DebugMessages.Count > 0 ? log.DebugMessages.ToArray() : null
                };
            }
        }
    }
}