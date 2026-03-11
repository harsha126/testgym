import api from "./axiosInstance";

export const importExcel = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/excel/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const exportExcel = () =>
    api.get("/excel/export", { responseType: "blob" });
