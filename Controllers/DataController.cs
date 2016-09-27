using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using ReportGenerator.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using System.Net;
using System.Threading.Tasks;

namespace ReportGenerator.Controllers
{
    [Route("api/[controller]")]
    public class DataController : Controller
    {
        private static readonly XNamespace a = "http://www.w3.org/2005/Atom";
        private static readonly XNamespace d = "http://schemas.microsoft.com/ado/2007/08/dataservices";
        private static readonly XNamespace m = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata";
        private readonly IHostingEnvironment _hostingEnvironment;

        public DataController(IHostingEnvironment hostingEnvironment)
        {
            this._hostingEnvironment = hostingEnvironment;
        }

        [HttpGet("customers")]
        public IEnumerable<Customer> GetCustomers()
        {
            return GetFromFiles("customers", properties => new Customer
            {
                Id = (int)properties.Element(d + "Идентификатор"),
                ShortName = properties.Element(d + "КраткоеНаименованиеЗаказчика").Value,
                Name = properties.Element(d + "ПолноеНаименованиеЗаказчика").Value
            });
        }

        [HttpGet("projects")]
        public IEnumerable<Project> GetProjects()
        {
            return GetFromFiles("projects", properties => new Project
            {
                Id = (int)properties.Element(d + "Идентификатор"),
                Name = properties.Element(d + "НаименованиеПроекта").Value,
                CustomerId = (int)properties.Element(d + "КраткоеНаименованиеЗаказчикаId")
            });
        }

        private IEnumerable<T> GetFromFiles<T>(string file, Func<XElement, T> mapper)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data");
            return Directory.GetFiles(path, file + "-?.xml").SelectMany(
                filePath =>
                    GetProperties(XDocument.Load(filePath)).Select(mapper)
                );
        }

        [HttpGet("my-projects")]
        public IEnumerable<int> GetMyProjects()
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-projects.txt");
            if (System.IO.File.Exists(path))
            {
                return System.IO.File.ReadLines(path).Select(line => Int32.Parse(line));
            }
            return Enumerable.Empty<int>();
        }

        [HttpPut("my-projects")]
        public void SetMyProjects([FromBody] int[] projectIds)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-projects.txt");
            System.IO.File.WriteAllLines(path, projectIds.Select(id => id.ToString()));
        }

        [HttpGet("titles")]
        public IEnumerable<string> GetTitles()
        {
            return GetFiles().SelectMany(file => System.IO.File.ReadAllLines(file).Skip(1))
                .Select(line => line.Split('\t')[0]).Distinct().OrderBy(t => t);
        }

        private string[] GetFiles()
        {
            return Directory.GetFiles(GetMonitorPath(), "*.csv");
        }

        private static string GetMonitorPath()
        {
            return Path.Combine(Environment.ExpandEnvironmentVariables("%APPDATA%"), "WindowTitleMonitor");
        }

        [HttpGet("my-titles")]
        public IEnumerable<Title> GetMyTitles()
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-titles.txt");
            if (System.IO.File.Exists(path))
            {
                return System.IO.File.ReadAllLines(path).Select(line =>
                {
                    var parts = line.Split('\t');
                    return new Title
                    {
                        Name = parts[0],
                        ProjectId = Int32.Parse(parts[1])
                    };
                });
            }
            else
            {
                return Enumerable.Empty<Title>();
            }
        }

        [HttpPut("my-titles")]
        public void SetMyTitles([FromBody] Title[] titles)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-titles.txt");
            System.IO.File.WriteAllLines(path, titles.Select(title => $"{title.Name}\t{title.ProjectId}"));
        }

        [HttpGet("reports")]
        public IEnumerable<ReportFile> GetReportFiles()
        {
            return GetFiles().Select(file => new ReportFile
            {
                Name = Path.GetFileName(file),
                Date = System.IO.File.GetCreationTime(file)
            });
        }

        [HttpGet("report/{file}")]
        public IEnumerable<ReportItem> GetReport(string file)
        {
            var path = Path.Combine(GetMonitorPath(), file);
            if (System.IO.File.Exists(path))
            {
                var date = System.IO.File.GetCreationTime(path);
                var items = System.IO.File.ReadAllLines(path).Select(line =>
                {
                    return line.Split('\t');
                }).Skip(1).Where(parts => parts.Length == 2).Select(parts =>
                {
                    return new { Name = parts[0], Count = Int32.Parse(parts[1]) };
                });
                var customers = GetCustomers();
                var projects = GetProjects();
                var myTitles = GetMyTitles();
                var titles = from i in items
                             join t in myTitles on i.Name equals t.Name
                             group i.Count by t.ProjectId into g
                             select new
                             {
                                 ProjectId = g.Key,
                                 Count = g.Sum()
                             };
                return from t in titles
                       join p in projects on t.ProjectId equals p.Id
                       join c in customers on p.CustomerId equals c.Id
                       select new ReportItem
                       {
                           Date = date,
                           Customer = c,
                           Project = p,
                           Title = "",
                           Type = "",
                           Hours = Math.Round(t.Count / (double)3600, 3)
                       };
            }
            return Enumerable.Empty<ReportItem>();
        }

        [HttpPost("sync")]
        public async Task<IActionResult> Sync()
        {
            var baseUrl = "http://ntc-st/ASURV/_vti_bin/listdata.svc/";
            await LoadFromServer(baseUrl + "Заказчики", "customers", 0);
            await LoadFromServer(baseUrl + "ЗаказчикиПроекты", "projects", 0);
            await LoadFromServer(baseUrl + "ВидыРабот", "types", 0);
            return Ok();
        }

        private async Task LoadFromServer(string url, string file, int index)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", file + "-" + index.ToString() + ".xml");
            var request = WebRequest.Create(url);
            request.Credentials = CredentialCache.DefaultNetworkCredentials;
            var response = await request.GetResponseAsync();
            using (var input = response.GetResponseStream())
            {
                using (var output = System.IO.File.OpenWrite(path))
                {
                    input.CopyTo(output);
                }

                var doc = XDocument.Load(path);
                var next = doc.Root.Elements(a + "link").FirstOrDefault(link => link.Attribute("rel").Value == "next");
                if (next != null)
                {
                    await LoadFromServer(next.Attribute("href").Value, file, index + 1);
                }
            }
        }

        private IEnumerable<XElement> GetProperties(XDocument doc)
        {
            return doc.Root.Elements(a + "entry")
                .Select(entry => entry
                    .Element(a + "content")
                    .Element(m + "properties"));
        }

    }
}