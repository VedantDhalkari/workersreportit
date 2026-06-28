import React, { useState } from "react";
// import axios from "axios"; // Make sure this is imported
import { API, useAuth } from "../context/AuthContext";

export default function ReportForm({ onAdd }) {
  // grab the logged-in user
  const { user: currentUser } = useAuth();

  const [entry, setEntry] = useState({
    projectName: "",
    projectNumber: "",
    customer: "",
    workDone: [""],
    priority: "medium",
    status: "Open", // ← include status here
  });

  const [images, setImages] = useState([]); // File[]
  const [imgError, setImgError] = useState("");
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    setImgError("");

    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      return setImgError("Maximum 5 images allowed");
    }
    for (let f of files) {
      if (f.size > 4 * 1024 * 1024) {
        return setImgError("Each image must be ≤ 4 MB");
      }
    }
    setImages((prev) => [...prev, ...files]);
  };

  // const submit = async (e) => {
  //   e.preventDefault();
  //   setImgError("");
  //   setErrors({});

  //   // build your payload with the proper user info
  //   const reportPayload = {
  //     ...entry,
  //     agent: currentUser._id,
  //     createdBy: currentUser.name,
  //     timestamp: Date.now(),
  //   };

  //   try {
  //     // 1) Create the report
  //     const { data } = await API.post("/reports", reportPayload);
  //     const reportId = data.report._id;

  //     // 2) If images selected, upload them
  //     if (images.length) {
  //       const formData = new FormData();
  //       formData.append("reportId", reportId);
  //       images.forEach((file) => formData.append("images", file));

  //       await API.post("/reports/upload-img-blob", formData, {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       });
  //     }

  //     alert("Report submitted successfully! 🎉");
  //     onAdd({ ...reportPayload, id: reportId, imagesCount: images.length });

  //     // reset form
  //     setEntry({
  //       projectName: "",
  //       projectNumber: "",
  //       customer: "",
  //       workDone: [""],
  //       priority: "medium",
  //       status: "Open",
  //     });
  //     setImages([]);
  //   } catch (err) {
  //     console.error("Error saving report:", err);
  //     alert("Failed to save report to server 😭");
  //   }
  // };

  const handleWorkDoneChange = (index, value) => {
    const newWorkDone = [...entry.workDone];
    newWorkDone[index] = value;
    setEntry({ ...entry, workDone: newWorkDone });
  };

  const addWorkEntry = () => {
    setEntry({ ...entry, workDone: [...entry.workDone, ""] });
  };



  const submit = async (e) => {
    e.preventDefault();
    setImgError("");
    setErrors({});

    const reportPayload = {
      ...entry,
      agent: currentUser.id,
      createdBy: currentUser.name,
      timestamp: Date.now(),
    };

    try {
      // 1) Create the report
      const { data } = await API.post("/reports", reportPayload);
      const reportId = data.report._id;

      // 2) Upload images if any
      if (images.length) {
        const formData = new FormData();
        formData.append("reportId", reportId);
        images.forEach((file) => formData.append("images", file));

        await API.post("/reports/upload-img-blob", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 3) Success!
      alert("Report submitted successfully! 🎉");
      onAdd({ ...reportPayload, _id: reportId, imagesCount: images.length });

      // 4) Reset form
      setEntry({
        projectName: "",
        projectNumber: "",
        customer: "",
        workDone: [""],
        priority: "medium",
        status: "Open",
      });
      setImages([]);
    } catch (err) {
      const res = err.response;

      // Duplicate projectNumber error
      if (res?.status === 400 && res.data.field === "projectNumber") {
        setErrors({ projectNumber: res.data.msg });
        return;
      }

      // Other client validation errors (optional)
      if (res?.status === 400 && res.data.errors) {
        // pick first or map
        setErrors({ projectNumber: res.data.errors[0] });
        return;
      }

      // Fallback
      console.error("Error saving report:", err);
      alert("Failed to save report to server 😭");
    }
  };


  return (
    <>
      <br />
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto mt-5">
        {/* Form Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.4145.414A1 1 0 0119 5.414V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-600">New</span>
              <span className="text-red-600"> Report</span>
            </h1>
          </div>
          <p className="text-gray-600">
            Submit field report with complete details
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter project name"
                  value={entry.projectName}
                  onChange={(e) =>
                    setEntry({ ...entry, projectName: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Project Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Number *
              </label>
              <div className="relative rounded-md shadow-sm">
              <input
            type="text"
            required
            className={`w-full px-4 py-3 border ${
              errors.projectNumber
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } rounded-lg transition-all`}
            placeholder="Enter project number"
            value={entry.projectNumber}
            onChange={(e) => {
              setEntry({ ...entry, projectNumber: e.target.value });
              setErrors({ ...errors, projectNumber: null });
            }}
          />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {errors.projectNumber && (
          <p className="mt-2 text-sm text-red-600">
            {errors.projectNumber}
          </p>
        )}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter customer name"
                value={entry.customer}
                onChange={(e) =>
                  setEntry({ ...entry, customer: e.target.value })
                }
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Work Done Entries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Done *
            </label>
            <div className="space-y-3">
              {entry.workDone.map((work, index) => (
                <div key={index} className="flex gap-3">
                  <div className="relative flex-1 rounded-md shadow-sm">
                    <input
                      type="text"
                      required={index === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={`Work entry ${index + 1}`}
                      value={work}
                      onChange={(e) =>
                        handleWorkDoneChange(index, e.target.value)
                      }
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleWorkDoneChange(index, "")}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-red-500 hover:text-red-700"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addWorkEntry}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Another Work Entry
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <div className="relative rounded-md shadow-sm">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                value={entry.priority}
                onChange={(e) =>
                  setEntry({ ...entry, priority: e.target.value })
                }
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={entry.status}
              onChange={(e) => setEntry({ ...entry, status: e.target.value })}
            >
              <option>Open</option>
              <option>In-Progress</option>
              <option>Done</option>
              {/* <option>Closed</option> */}
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attach Images{" "}
              <span className="text-gray-500">(max 5, ≤ 4 MB each)</span>
            </label>

            <div
              className="relative border-2 border-dashed border-gray-300 
                rounded-lg p-6 text-center hover:border-blue-500
                transition-colors duration-200"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Drag & drop images or{" "}
                  <span className="text-blue-600 font-medium">
                    browse files
                  </span>
                </p>
              </div>
            </div>

            {imgError && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ {imgError}
              </p>
            )}

            {images.length > 0 && (
              <p className="mt-3 text-sm text-gray-600 italic">
                📸 {images.length} image{images.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Report
          </button>
        </form>
      </div>
    </>
  );
}
