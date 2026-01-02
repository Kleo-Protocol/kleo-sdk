import axios, { AxiosInstance, AxiosError } from 'axios';
import { KleoConfig, RequestOptions, ApiResponse, ApiError } from './types';

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private client: AxiosInstance;
  private config: Required<KleoConfig>;

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options
   */
  constructor(config: KleoConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.kleo.example.com',
      timeout: config.timeout || 30000,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any request modifications here
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError<ApiError>) => {
        // Handle errors consistently
        const apiError: ApiError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details,
        };
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Make a GET request
   * @param path - API endpoint path
   * @param options - Request options
   */
  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(path, {
      headers: options?.headers,
      timeout: options?.timeout,
    });

    return {
      data: response.data,
      status: response.status,
    };
  }

  /**
   * Make a POST request
   * @param path - API endpoint path
   * @param data - Request body data
   * @param options - Request options
   */
  async post<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(path, data, {
      headers: options?.headers,
      timeout: options?.timeout,
    });

    return {
      data: response.data,
      status: response.status,
    };
  }

  /**
   * Make a PUT request
   * @param path - API endpoint path
   * @param data - Request body data
   * @param options - Request options
   */
  async put<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(path, data, {
      headers: options?.headers,
      timeout: options?.timeout,
    });

    return {
      data: response.data,
      status: response.status,
    };
  }

  /**
   * Make a DELETE request
   * @param path - API endpoint path
   * @param options - Request options
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(path, {
      headers: options?.headers,
      timeout: options?.timeout,
    });

    return {
      data: response.data,
      status: response.status,
    };
  }
}
