﻿using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace BioModelAnalyzer
{
    public class AnalysisResult
    {
        public class Tick
        {
            public class Variable
            {
                [XmlAttribute]
                public int Id { get; set; }

                [XmlAttribute]
                public double Lo { get; set; }

                [XmlAttribute]
                public double Hi { get; set; }
            }

            public int Time { get; set; }

            [XmlArrayItem("Variable")]
            public Variable[] Variables { get; set; }
        }

        [JsonConverter(typeof(StringEnumConverter))]
        public StatusType Status { get; set; }

        /// <summary>Additional error information if status is nor Stabilizing neither NonStabilizing</summary>
        [XmlIgnore]
        public string Error { get; set; }

        [XmlElement("Tick", Type = typeof(Tick))]
        public Tick[] Ticks { get; set; }
    }

    public enum StatusType
    {
        Default,
        TryingStabilizing,
        Bifurcation,
        Cycle,
        Stabilizing,
        NotStabilizing,
        Fixpoint,
        Unknown,
        Error
    }
}