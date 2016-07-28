﻿using bma.BioCheck;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Analyze
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 2 || args.Length > 3) throw new System.ArgumentException("Incorrect number of arguments");
            var inputJson = File.ReadAllText(args[0]);
            var query = JsonConvert.DeserializeObject<AnalysisInput>(inputJson);

            var res = Analysis.Analyze(query);

            var jsRes = JsonConvert.SerializeObject(res);
            File.WriteAllText(args[1], jsRes);
            if (args.Length >= 3)
            {
                File.WriteAllLines(args[2], (res != null && res.ErrorMessages != null) ? res.ErrorMessages : new string[0]);
            }
        }
    }
}
