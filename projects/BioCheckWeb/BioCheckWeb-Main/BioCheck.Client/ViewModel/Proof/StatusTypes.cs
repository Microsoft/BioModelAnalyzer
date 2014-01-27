﻿namespace BioCheck.ViewModel.Proof
{
    public struct StatusTypes
    {
        public const string Default = "Default";
        public const string TryingStabilizing = "TryingStabilizing";
        public const string Bifurcation = "Bifurcation";
        public const string Cycle = "Cycle";
        public const string Stabilizing = "Stabilizing";
        public const string NotStabilizing = "NotStabilizing";
        public const string Fixpoint = "Fixpoint";
        public const string Unknown = "Unknown";
        public const string Error = "Error";
        public const string True = "True";          // Time edit : LTL status output
        public const string False = "False";        // Time edit : LTL status output
    }
}