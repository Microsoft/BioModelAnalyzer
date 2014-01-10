﻿using System.Windows.Media;
using System;
using System.Windows.Data;

namespace BioCheck.Converters
{
    /// <summary>
    /// Two way IValueConverter that lets you bind a property on a bindable object that can be an empty string value to a dependency property that should be set to null in that case.
    /// </summary>
    public class BoolToStabilityBrushConverter : IValueConverter
    {
        public Brush IsStableBrush { get; set; }

        public Brush NotStableBrush { get; set; }

        /// <summary>
        /// Converts <c>null</c> or empty strings to <c>null</c>.
        /// </summary>
        /// <param name="value">The value to convert.</param>
        /// <param name="targetType">The expected type of the result (ignored).</param>
        /// <param name="parameter">Optional parameter (ignored).</param>
        /// <param name="culture">The culture for the conversion (ignored).</param>
        /// <returns>If the <paramref name="value"/>is <c>null</c> or empty, this method returns <c>null</c> otherwise it returns the <paramref name="value"/>.</returns>
        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null)
                return IsStableBrush;

            bool isStable = System.Convert.ToBoolean(value);

            if (isStable)
                return IsStableBrush;
            else
                return NotStableBrush;
        }

        /// <summary>
        /// Converts <c>null</c> back to <see cref="String.Empty"/>.
        /// </summary>
        /// <param name="value">The value to convert.</param>
        /// <param name="targetType">The expected type of the result (ignored).</param>
        /// <param name="parameter">Optional parameter (ignored).</param>
        /// <param name="culture">The culture for the conversion (ignored).</param>
        /// <returns>If <paramref name="value"/> is <c>null</c>, it returns <see cref="String.Empty"/> otherwise <paramref name="value"/>.</returns>
        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            return value ?? string.Empty;
        }
    }
}
