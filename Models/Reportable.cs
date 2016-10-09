namespace ReportGenerator.Models{
    public class Reportable{
        public Reportable(int count, int projectId, int typeId){
            Count = count;
            ProjectId = projectId;
            TypeId = typeId;
        }
        public int Count { get; set; }
        public int ProjectId { get; set; }
        public int TypeId { get; set; }
    }
}