﻿using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using ReportGenerator.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using System.Net;
using System.Threading.Tasks;
using ReportGenerator.Services;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Microsoft.Extensions.Logging;

namespace ReportGenerator.Controllers
{
    [Route("api/[controller]")]
    public class DataController : Controller
    {
        private static readonly XNamespace a = "http://www.w3.org/2005/Atom";
        private static readonly XNamespace d = "http://schemas.microsoft.com/ado/2007/08/dataservices";
        private static readonly XNamespace m = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata";
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly ReportService _service;
        private readonly ILogger _logger;

        public DataController(IHostingEnvironment hostingEnvironment, ReportService service, ILoggerFactory loggerFactory)
        {
            this._hostingEnvironment = hostingEnvironment;
            this._service = service;
            this._logger = loggerFactory.CreateLogger("DataController");
        }

        [HttpGet("customers")]
        public IEnumerable<Customer> GetCustomers()
        {
            return GetFromFiles("customers", properties => new Customer
            {
                Id = (int)properties.Element(d + "Идентификатор"),
                ShortName = properties.Element(d + "КраткоеНаименованиеЗаказчика").Value,
                Name = properties.Element(d + "ПолноеНаименованиеЗаказчика").Value
            }).Concat(new[] { _service.Self });
        }

        [HttpGet("projects")]
        public IEnumerable<Project> GetProjects()
        {
            return GetFromFiles("projects", properties => new Project
            {
                Id = (int)properties.Element(d + "Идентификатор"),
                Name = properties.Element(d + "НаименованиеПроекта").Value,
                CustomerId = (int)properties.Element(d + "КраткоеНаименованиеЗаказчикаId")
            }).Concat(new[] { _service.Personal });
        }

        [HttpGet("types")]
        public IEnumerable<WorkType> GetTypes()
        {
            return GetFromFiles("types", properties => new WorkType
            {
                Id = (int)properties.Element(d + "Идентификатор"),
                Name = properties.Element(d + "Название").Value,
                Description = properties.Element(d + "Расшифровка").Value
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

        [HttpGet("titles/{date:DateTime}")]
        public IEnumerable<Title> GetTitles([FromRoute] DateTime date)
        {
            return GetFiles(date).SelectMany(GetTitles)
                .Distinct().OrderBy(t => t.Name);
        }

        private string[] GetFiles(DateTime? date = null)
        {
            return Directory.GetFiles(GetMonitorPath(), (date != null ? date.Value.ToString("yyyy-MM-dd") : "") + "*.csv");
        }

        private static string GetMonitorPath()
        {
            return Path.Combine(Environment.ExpandEnvironmentVariables("%APPDATA%"), "WindowTitleMonitor");
        }

        [HttpGet("my-titles")]
        public IEnumerable<MyTitle> GetMyTitles()
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-titles.txt");
            if (System.IO.File.Exists(path))
            {
                return System.IO.File.ReadAllLines(path).Select(line =>
                {
                    var parts = line.Split('\t');
                    return new MyTitle
                    {
                        Name = parts[0],
                        ProjectId = Int32.Parse(parts[1]),
                        TypeId = Int32.Parse(parts[2])
                    };
                });
            }
            else
            {
                return Enumerable.Empty<MyTitle>();
            }
        }

        [HttpPut("my-titles")]
        public void SetMyTitles([FromBody] MyTitle[] titles)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", "my-titles.txt");
            System.IO.File.WriteAllLines(path, titles.Select(title => $"{title.Name}\t{title.ProjectId}\t{title.TypeId}"));
        }

        [HttpGet("reports/{date:DateTime}")]
        public IEnumerable<ReportFile> GetReportFiles([FromRoute]DateTime date)
        {
            return GetFiles(date).Select(file => new ReportFile
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
                var date = DateTime.ParseExact(file.Substring(0, 10), "yyyy-MM-dd", null);
                var items = GetTitles(path);
                var customers = GetCustomers();
                var projects = GetProjects();
                var myTitles = GetMyTitles();
                var types = GetTypes().Concat(new[] { _service.NoWorkType });
                var titles = from i in items
                             join t in myTitles on i.Name equals t.Name
                             group i.Count by new { t.ProjectId, t.TypeId } into g
                             select new
                             {
                                 Key = g.Key,
                                 Count = g.Sum()
                             };
                var results = from t in titles
                              join p in projects on t.Key.ProjectId equals p.Id
                              join c in customers on p.CustomerId equals c.Id
                              join w in types on t.Key.TypeId equals w.Id
                              select new ReportItem
                              {
                                  Date = date,
                                  Customer = c,
                                  Project = p,
                                  Type = w.Name,
                                  Seconds = t.Count
                              };
                return results;
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

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromBody] ReportItem[] items)
        {
            foreach (var item in items)
            {
                var uploadItem = CreateUploadItem(item);
                _logger.LogInformation("Uploading: \n" + uploadItem.ToString());
                var result = await UploadItem(uploadItem);
                _logger.LogInformation("Uploaded. Response: \n" + result.ToString());
            }
            return Ok();
        }

        private async Task<JObject> UploadItem(JObject item)
        {
            var baseUrl = "http://ntc-st/ASURV/_vti_bin/listdata.svc/ТабельРабочегоВремени";
            var json = JsonConvert.SerializeObject(item);
            var data = System.Text.Encoding.UTF8.GetBytes(json);
            var request = WebRequest.CreateHttp(baseUrl);
            request.Method = "POST";
            request.ContentType = "application/json;charset=utf-8";
            request.Accept = "application/json";
            request.Credentials = CredentialCache.DefaultNetworkCredentials;
            using (var stream = await request.GetRequestStreamAsync())
            {
                stream.Write(data, 0, data.Length);
            }
            var response = await request.GetResponseAsync();
            using (var stream = response.GetResponseStream())
            {
                using (var reader = new StreamReader(stream))
                {
                    var responseString = reader.ReadToEnd();
                    return JObject.Parse(responseString);
                }
            }
        }

        private JObject CreateUploadItem(ReportItem item)
        {
            var result = new JObject();
            result.Add("Название", item.Type);
            result.Add("ТипРаботValue", item.Type);
            result.Add("Заказчик", item.Customer.ShortName);
            result.Add("Проект", item.Project.Name);
            result.Add("Время", item.AdjustedSeconds / 3600);
            result.Add("ОшибкаВЗаказчике", false);
            result.Add("ОшибкаВПроекте", false);
            result.Add("ДатаПроведенияРабот", item.Date);
            return result;
        }

        private async Task LoadFromServer(string url, string file, int index)
        {
            var path = Path.Combine(this._hostingEnvironment.ContentRootPath, "data", file + "-" + index.ToString() + ".xml");
            var request = WebRequest.Create(url);
            request.Credentials = CredentialCache.DefaultNetworkCredentials;
            var response = await request.GetResponseAsync();
            using (var input = response.GetResponseStream())
            {
                using (var output = System.IO.File.Create(path))
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

        private IEnumerable<Title> GetTitles(string path)
        {
            return System.IO.File.ReadAllLines(path).Select(line =>
                {
                    return line.Split('\t');
                }).Skip(1).Where(parts => parts.Length == 2).Select(parts =>
                {
                    return new Title { Name = parts[0], Count = Int32.Parse(parts[1]) };
                });
        }
    }
}