using System.Collections.Generic;
using System.Linq;
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

        public IEnumerable<ReportItem> Process(IEnumerable<ReportItem> input)
        {
            var inputList = input.ToList();
            var nonPersonal = inputList.Where(r => r.Project.Id != Personal.Id).ToList();
            if (nonPersonal.Any()){
                var total = nonPersonal.Sum(r=>r.Seconds);
                var factor = total / (3600 * 8);
                var values = nonPersonal.Select(r=>{
                    return (r.Seconds / factor) / 800;
                });
            }
            return inputList;
        }
    }
}