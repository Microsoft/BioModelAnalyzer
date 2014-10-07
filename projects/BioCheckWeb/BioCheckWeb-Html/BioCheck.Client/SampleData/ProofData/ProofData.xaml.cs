﻿//      *********    DO NOT MODIFY THIS FILE     *********
//      This file is regenerated by a design tool. Making
//      changes to this file can cause errors.
namespace Expression.Blend.SampleData.ProofData
{
	using System; 

// To significantly reduce the sample data footprint in your production application, you can set
// the DISABLE_SAMPLE_DATA conditional compilation constant and disable sample data at runtime.
#if DISABLE_SAMPLE_DATA
	internal class ProofData { }
#else

	public class ProofData : System.ComponentModel.INotifyPropertyChanged
	{
		public event System.ComponentModel.PropertyChangedEventHandler PropertyChanged;

		protected virtual void OnPropertyChanged(string propertyName)
		{
			if (this.PropertyChanged != null)
			{
				this.PropertyChanged(this, new System.ComponentModel.PropertyChangedEventArgs(propertyName));
			}
		}

		public ProofData()
		{
			try
			{
				System.Uri resourceUri = new System.Uri("/BioCheck;component/SampleData/ProofData/ProofData.xaml", System.UriKind.Relative);
				if (System.Windows.Application.GetResourceStream(resourceUri) != null)
				{
					System.Windows.Application.LoadComponent(this, resourceUri);
				}
			}
			catch (System.Exception)
			{
			}
		}

		private Variables _Variables = new Variables();

		public Variables Variables
		{
			get
			{
				return this._Variables;
			}
		}

		private ProgressionInfos _ProgressionInfos = new ProgressionInfos();

		public ProgressionInfos ProgressionInfos
		{
			get
			{
				return this._ProgressionInfos;
			}
		}

		private string _ModelName = string.Empty;

		public string ModelName
		{
			get
			{
				return this._ModelName;
			}

			set
			{
				if (this._ModelName != value)
				{
					this._ModelName = value;
					this.OnPropertyChanged("ModelName");
				}
			}
		}

		private double _NumberOfSteps = 0;

		public double NumberOfSteps
		{
			get
			{
				return this._NumberOfSteps;
			}

			set
			{
				if (this._NumberOfSteps != value)
				{
					this._NumberOfSteps = value;
					this.OnPropertyChanged("NumberOfSteps");
				}
			}
		}
	}

	public class Variables : System.Collections.ObjectModel.ObservableCollection<VariablesItem>
	{ 
	}

	public class VariablesItem : System.ComponentModel.INotifyPropertyChanged
	{
		public event System.ComponentModel.PropertyChangedEventHandler PropertyChanged;

		protected virtual void OnPropertyChanged(string propertyName)
		{
			if (this.PropertyChanged != null)
			{
				this.PropertyChanged(this, new System.ComponentModel.PropertyChangedEventArgs(propertyName));
			}
		}

		private string _Name = string.Empty;

		public string Name
		{
			get
			{
				return this._Name;
			}

			set
			{
				if (this._Name != value)
				{
					this._Name = value;
					this.OnPropertyChanged("Name");
				}
			}
		}

		private string _GraphColor = string.Empty;

		public string GraphColor
		{
			get
			{
				return this._GraphColor;
			}

			set
			{
				if (this._GraphColor != value)
				{
					this._GraphColor = value;
					this.OnPropertyChanged("GraphColor");
				}
			}
		}

		private string _Range = string.Empty;

		public string Range
		{
			get
			{
				return this._Range;
			}

			set
			{
				if (this._Range != value)
				{
					this._Range = value;
					this.OnPropertyChanged("Range");
				}
			}
		}

		private double _InitialValue = 0;

		public double InitialValue
		{
			get
			{
				return this._InitialValue;
			}

			set
			{
				if (this._InitialValue != value)
				{
					this._InitialValue = value;
					this.OnPropertyChanged("InitialValue");
				}
			}
		}
	}

	public class ProgressionInfos : System.Collections.ObjectModel.ObservableCollection<ProgressionInfosItem>
	{ 
	}

	public class ProgressionInfosItem : System.ComponentModel.INotifyPropertyChanged
	{
		public event System.ComponentModel.PropertyChangedEventHandler PropertyChanged;

		protected virtual void OnPropertyChanged(string propertyName)
		{
			if (this.PropertyChanged != null)
			{
				this.PropertyChanged(this, new System.ComponentModel.PropertyChangedEventArgs(propertyName));
			}
		}

		private double _InitialValue = 0;

		public double InitialValue
		{
			get
			{
				return this._InitialValue;
			}

			set
			{
				if (this._InitialValue != value)
				{
					this._InitialValue = value;
					this.OnPropertyChanged("InitialValue");
				}
			}
		}
	}
#endif
}