using ReportGenerator.Models;

namespace ReportGenerator.Services
{


    public class ReportService
    {
        public readonly Customer Self = new Customer
        {
            Id = -1,
            ShortName = "Self",
            Name = "Self"
        };
        public readonly Project Personal = new Project
        {
            Id = -1,
            Name = "Personal",
            CustomerId = -1
        };

        public readonly WorkType NoWorkType = new WorkType { Id = -1, Name = "" };
    }
}