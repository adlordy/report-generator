using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Exchange.WebServices.Data;
using Microsoft.Extensions.Options;
using ReportGenerator.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace ReportGenerator.Services
{
    public class ExchangeService
    {
        private readonly IOptions<ExchangeOptions> _options;
        private readonly ILogger _logger;
        public ExchangeService(IOptions<ExchangeOptions> options,ILoggerFactory factory){
            _options = options;
            _logger = factory.CreateLogger("Exchange");
        }

        public IEnumerable<Models.Meeting> GetMeetings(DateTime date)
        {
            var service = Configure();
            var calendar = CalendarFolder.Bind(service, WellKnownFolderName.Calendar, new PropertySet());
            var view = new CalendarView(date, date.AddDays(1));
            view.PropertySet = new PropertySet(AppointmentSchema.Subject, AppointmentSchema.Start, AppointmentSchema.End);
            var meetings = calendar.FindAppointments(view)
                .Select(m =>
                new Models.Meeting
                {
                    Subject = m.Subject,
                    Start = m.Start,
                    End = m.End
                });
            return meetings;
        }

        public string DiscoverUrl()
        {
            var service = Configure();
            return service.Url.ToString();
        }

        private Microsoft.Exchange.WebServices.Data.ExchangeService Configure(){
            var options =  _options.Value;
            _logger.LogInformation("Using options: "+JsonConvert.SerializeObject(options));
            var email = options.Email;
            var service = new Microsoft.Exchange.WebServices.Data.ExchangeService(ExchangeVersion.Exchange2013);
            if (String.IsNullOrEmpty(options.Password)){
                service.UseDefaultCredentials = true;
            } else{
                service.Credentials = new WebCredentials(email, options.Password);
            }
            if (String.IsNullOrEmpty(options.Url)){
                service.AutodiscoverUrl(email, RedirectionUrlValidationCallback);
            } else {
                service.Url = new Uri(options.Url);
            }
            return service;
        }

        private static bool RedirectionUrlValidationCallback(string redirectionUrl)
        {
            return true;
        }
    }
}