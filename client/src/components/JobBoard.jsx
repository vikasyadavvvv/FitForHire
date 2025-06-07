import React from "react";
import { useEffect, useState } from "react";

export default function JobBoard({ resumeText }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const res = await fetch("http://localhost:5000/api/job");
      const data = await res.json();
      setJobs(data);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Job Listings</h2>

      {loading && <p>Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            <h3 className="text-lg font-semibold">{job.title} @ {job.company}</h3>
            <p className="text-sm text-gray-600">{job.location}</p>
            <div className="mt-2">
              {job.skills.map((skill, idx) => (
                <span key={idx} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded mr-1">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <div className="mt-10 p-4 bg-white shadow rounded">
          <h3 className="text-xl font-bold mb-2">{selectedJob.title}</h3>
          <p className="mb-4 text-gray-600">{selectedJob.description}</p>
          <ResumeAnalyzer resumeText={resumeText} jobDescription={selectedJob.description} />
        </div>
      )}
    </div>
  );
}
