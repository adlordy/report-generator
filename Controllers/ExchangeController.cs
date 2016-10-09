using Microsoft.AspNetCore.Mvc;
using ReportGenerator.Services;
using System.Collections.Generic;
using ReportGenerator.Models;
using System;

namespace ReportGenerator.Controllers
{
    [Route("api/[controller]")]
    public class ExchangeController : Controller
    {
        private readonly ExchangeService _service;
        public ExchangeController(ExchangeService service)
        {
            _service = service;
        }

        [RouteAttribute("meetings/{date:DateTime}")]
        public IEnumerable<Meeting> GetMettings(DateTime date)
        {
            return _service.GetMeetings(date);
        }

        [RouteAttribute("discover")]
        public string Discover()
        {
            return _service.DiscoverUrl();
        }
    }
}