import { useAuth } from "@/contexts/AuthProvider";
import { UserBasicInformation } from "@/types";
import axios from "axios";

// export let HOST = "http://api.nextwaves.vn/";
// try {
//   if (window.location.hostname === "localhost:3000") {
//     HOST = "http://api.nextwaves.vn/";
//   } else {
//     HOST = "https://api.nextwaves.vn";
//   }
// } catch (error) {
//   HOST = process.env.REACT_APP_API_URL || "https://api.nextwaves.vn";
// }

export const HOST = process.env.NEXT_PUBLIC_HOST;


export interface PostData {
  title: string;
  description: string;
  location: string;
  category: string;
  openFor: string;
  isPublic: boolean;
  isLGBT: boolean;
  withFriends: boolean;
  tags: string[];
  questions: string[];
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  postedBy?: string;
}
export interface NewAccount {
  email: string;
  password: string;
  name: string;
  phone: string;
}
const getToken = async () => {
  return localStorage.getItem("authToken");
};

export const loginApi = async (username: string, password: string) => {
  const url = `${HOST}/api/v1/auth/login`;

  const headers = { "Content-Type": "application/json" };
  const data = { eop: username, password: password };

  try {
    const response = await axios.post(url, data, { headers });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("UNKNOWN_ERROR");
    }
  }
};
export const getMe = async () => {
  const url = `${HOST}/api/v1/auth/info`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (
        error.response.data.message.toLocaleUpperCase() == "UNAUTHORIZED" ||
        error.response.data.message == "TOKEN_EXPIRED"
      ) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(error.response.data.message);
    } else {
      throw new Error("UNKNOWN_ERROR");
    }
  }
};
export const loginSSO = async (type: string, code: string) => {
  const url = `${HOST}/api/v1/auth/sso/login`;
  const headers = { "Content-Type": "application/json" };
  const data = { type: type, code: code };

  try {
    const response = await axios.post(url, data, { headers });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("UNKNOWN_ERROR");
    }
  }
};
export const registerNewAccount = async (
  newAccount: NewAccount,
  captcha: string
) => {
  const url = `${HOST}/api/v1/users/registration`;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      url,
      {
        data: newAccount,
        captcha: captcha,
      },
      { headers }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};
export const createPost = async (postData: PostData) => {
  console.log(await getToken());

  const url = `${HOST}/api/v1/posts`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(url, postData, { headers });

    console.log("Post created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
  }
};

export const getPostsById = async (id: string) => {
  const url = `${HOST}/api/v1/posts/d/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const patchPost = async (id: string, postData: PostData) => {
  const url = `${HOST}/api/v1/posts/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.patch(url, postData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error);
  }
};

export const confirmEmail = async (code: string, email: string) => {
  const url = `${HOST}/api/v1/users/confirm`;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      url,
      {
        code: code,
        email: email,
      },
      { headers }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const listPostByMe = async (
  page: number,
  limit: number,
  filters: string
) => {
  const url = `${HOST}/api/v1/posts/me`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { page, limit, filter: filters },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const feedListing = async (
  page: number,
  limit: number,
  filters: string
) => {
  const url = `${HOST}/api/v1/posts/feed`;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { page, limit, filters: filters },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};
export const getDetailPostById = async (id: string) => {
  const url = `${HOST}/api/v1/posts/d/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const applyPost = async (id: string, data: any) => {
  const url = `${HOST}/api/v1/applications/apply/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Error applying post:", error);
  }
};

export const uploadFile = async (file: File) => {
  try {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    const response = await fetch(`${HOST}/api/v1/file/upload`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + (await localStorage.getItem("authToken")),
      },
      body: uploadFormData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload resume.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};
export const searchCities = async (query: string) => {
  const url = `${HOST}/api/v1/cities?q=${query}`;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const getAllApplicationPost = async (id: string) => {
  const url = `${HOST}/api/v1/applications/posted/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const rejectApplication = async (id: string, reason: string) => {
  const url = `${HOST}/api/v1/applications/reject/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(
      url,
      { rejectMessage: reason },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const patchNewUserInformation = async (data: UserBasicInformation) => {
  const url = `${HOST}/api/v1/users/update-profile`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.patch(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const patchNewAvatar = async (avatar: string) => {
  const url = `${HOST}/api/v1/users/update-avatar`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.patch(url, { avatar: avatar }, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting posts:", error);
  }
};

export const getPublicProfile = async (id: string) => {
  const url = `${HOST}/api/v1/users/public/${id}`;
  const headers = {
    "Content-Type": "application/json",
    // Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(
      url,

      { headers }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const searchProduct = async (search: string) => {
  const url = `${HOST}/api/v1/products?filter=q=${search}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data.data.items;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const searchCustomer = async (search: string) => {
  const url = `${HOST}/api/v1/customers?filter=q=${search}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data.data.items;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const getTagValue = async (id: string) => {
  const url = `${HOST}/api/v1/tags/epc/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data.data;
  } catch (error: any) {
    //throw new Error(error.response.data.message);
    if (error.response && error.response.data !== undefined) {
      return error.response.data.message;
    } else {
      return "UNKNOWN_ERROR";
    }
  }
};

export const getProductId = async (id: string) => {
  const url = `${HOST}/api/v1/products/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const getMedicalId = async (id: string) => {
  const url = `${HOST}/api/v1/products/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const getCustomerId = async (id: string) => {
  const url = `${HOST}/api/v1/customers/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

interface AssignTagBulkParams {
  tags: string[];
  tagType: string;
  tagValue: string;
}

export const assignTagBulk = async (data: AssignTagBulkParams) => {
  const url = `${HOST}/api/v1/tags/bulk`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

interface AssignTagToCustomerParams {
  tagType: string;
  tagName: string;
  tagEPC: string;
  tagValue: string;
}

export const assignTagToCustomer = async (data: AssignTagToCustomerParams) => {
  const url = `${HOST}/api/v1/tags`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

interface AssignTagToProductParams {
  tagType: string;
  tagEPC: string;
  tagValue: string;
}

export const assignTagToProduct = async (data: any) => {
  const url = `${HOST}/api/v1/tags/bulk`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const getCabinets = async () => {
  const url = `${HOST}/api/v1/cabinet`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };
  try {
    const response = await axios.get(url, { headers });
    console.log("response", response.data.data.items);
    return response.data.data.items;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const getCabinetItems = async (id: string) => {
  const url = `${HOST}/api/v1/cabinet/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };
  try {
    const response = await axios.get(url, { headers });
    console.log("response", response.data.data);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const updateCabinet = async (id: string, data: any) => {
  const url = `${HOST}/api/v1/cabinet/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };
  try {
    const response = await axios.patch(url, data, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.message);
  }
};

export const importProduct = async (data: any) => {
  const url = `${HOST}/api/v1/products/`
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error getting posts:", error);
    throw new Error(error.response.data.message);
  }
}

export const createCabinet = async (data: any) => {
  const url = `${HOST}/api/v1/cabinet/`
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error getting posts:", error);
    throw new Error(error.response.data.message);
  }
}

export const deleteCabinet = async (id: string) => {
  const url = `${HOST}/api/v1/cabinet/${id}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.delete(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting cabinet:", error);
    throw new Error(error.response?.data?.message || "Unknown error occurred");
  }
};

export const getAllDevices = async () => {
  const url = `${HOST}/api/v1/devices`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting cabinet:", error);
    throw new Error(error.response?.data?.message || "Unknown error occurred");
  }
}

export const getOnlineDevices = async () => {
  const url = `${HOST}/api/v1/devices/connected`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (await getToken()),
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting cabinet:", error);
    throw new Error(error.response?.data?.message || "Unknown error occurred");
  }
}