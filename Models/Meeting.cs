using System;

namespace ReportGenerator.Models
{
    public class Meeting
    {
        public string Subject { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public int Duration {
            get{
                return (int)(End - Start).TotalSeconds;
            }
        }
        
    }

    public class MyMeeting {
        public string Subject { get; set; }
        public int ProjectId { get; set; }
        public int TypeId { get; set; }
    }
}