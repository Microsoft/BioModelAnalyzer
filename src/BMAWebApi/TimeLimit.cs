﻿using Microsoft.WindowsAzure.ServiceRuntime;
using System;
using System.Diagnostics;
using System.Threading;
namespace BMAWebApi
{
    public class TimeoutException : Exception
    {
        public TimeoutException(TimeSpan timespan) : base(String.Format("Operation is not completed in {0}", timespan)) { }
    }

    public static class Utilities
    {
        public static T RunWithTimeLimit<T>(Func<T> func, TimeSpan timespan)
        {
            T result = default(T);
            Exception exc = null;
            Thread th = new Thread(() =>
            {
                try
                {
                    result = func();
                }
                catch (Exception e)
                {
                    exc = e;
                }
            });
            
            //th.IsBackground = true;
            th.Start();
            if (th.Join(timespan))
            {
                if (exc != null)
                    throw exc;
                else
                    return result;
            }
            else {
                th.Abort();
                throw new TimeoutException(timespan);
            }
        }

        public static readonly TimeSpan DefaultTimeLimit = TimeSpan.FromMinutes(2);

        public static TimeSpan GetTimeLimitFromConfig()
        {
            try {
                 return TimeSpan.FromSeconds(Int32.Parse(RoleEnvironment.GetConfigurationSettingValue("ComputeTimeLimit")));
            }
            catch(Exception exc) {
                Trace.WriteLine("Error reading TimeLimit setting: " + exc.Message);
                return DefaultTimeLimit;
            }
        }
    }
}