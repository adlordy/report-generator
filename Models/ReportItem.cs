using System;

namespace ReportGenerator.Models{
    public class ReportItem{
        public DateTime Date {get;set;}
        public Customer Customer {get;set;}
        public Project Project {get;set;}
        public string Title {get;set;}
        public double Seconds {get;set;}
        public double AdjustedSeconds {get;set;}
        public string Type {get;set;}
    }
}