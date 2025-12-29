//import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { api } from 'boot/axios';
import { getErrorMessage } from 'src/util/util';
import type { Paper, ScheduleAssignment } from 'src/components/models';

export interface NetConfig {
  method?: string,
  onDone?: () => void,
  onEnd?: () => void,
  onError?: (message: string) => void,
  onStream?: (value: string) => string,
  onSuccess?: (data: unknown) => void,
  token: string,
  url: string,
}


export function accessWithToken(config: NetConfig, data?: unknown, params?: unknown) {
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  const content_type: string =
    config.method == 'POST' ? 'application/x-www-form-urlencoded' : 'application/json';
  axios({
    method: config.method,
    url: config.url,
    headers: {
      Accept: 'application/json',
      'Content-Type': content_type,
      Authorization: 'Bearer ' + config.token,//useUserStore().getToken(),
    },
    params: params,
    data: data,
  })
    .then((response) => {
      if (config.onSuccess) {
        config.onSuccess(response.data);
      }
    })
    .catch((error: unknown) => {
      const errorMessage = getErrorMessage(error);
      if (config.onError) {
        config.onError(errorMessage);
      }
    })
    .finally(() => {
      if (config.onEnd) {
        config.onEnd();
      }
    });
}

function checkSteamResponse(response: Response) {
  if (response === null) throw new Error('No Response');
  else if (!response.ok) throw new Error(`Response status: ${response.status}`);
}

export async function streamWithToken(config: NetConfig, body: BodyInit | null) {
  try {
    const response = await fetch(config.url, {
      method: config.method ? config.method : 'GET',
      headers: {
        Authorization: 'Bearer ' + '', // useUserStore().getToken(),
        responseType: 'stream',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });
    checkSteamResponse(response);

    if (response.body !== null) {
      /*const stream: any = response.body.pipeThrough(new TextDecoderStream());
      for await (const value of stream) {
        if (config.onStream) {
          config.onStream(value);
        }
      }*/
      console.info(response.body);
    }
    if (config.onEnd) {
      config.onEnd();
    }
  } catch (e: unknown) {
    const error = getErrorMessage(e);
    if (config.onError) {
      config.onError(error);
    }
  }
}

export async function streamWithToken2(config: NetConfig, body: BodyInit | null) {
  let content_type = 'application/json';
  if (config.method && config.method.toUpperCase() == 'POST') {
    content_type = 'application/x-www-form-urlencoded';
  }
  try {
    const response = await fetch(config.url, {
      method: config.method ? config.method : 'GET',
      headers: {
        Authorization: 'Bearer ' + '', //useUserStore().getToken(),
        responseType: 'stream',
        'Content-Type': content_type,
      },
      body: body,
    });
    checkSteamResponse(response);
    if (response.body == null) return;

    const reader = response.body.getReader();
    const textDecoder = new TextDecoder('utf-8');
    let result = true;
    while (result) {
      const { done, value } = await reader.read();
      if (done) {
        result = false;
        if (config.onDone) {
          config.onDone();
        }
        break;
      }

      const chunkText = textDecoder.decode(value);
      if (config.onStream) {
        config.onStream(chunkText);
      }
    }
  } catch (e: unknown) {
    const error = getErrorMessage(e);
    if (config.onError) {
      config.onError(error);
    }
  } finally {
    if (config.onEnd) {
      config.onEnd();
    }
  }
}


// --- REST helpers for papers and schedules ---
export const paperApi = {
  list(params?: Record<string, unknown>) {
    return api.get('/api/papers', { params });
  },
  get(paperId: string) {
    return api.get(`/api/papers/${paperId}`);
  },
  create(payload: Paper) {
    return api.post('/api/papers', payload);
  },
  update(paperId: string, payload: Paper) {
    return api.put(`/api/papers/${paperId}`, payload);
  },
  publish(paperId: string, version?: number) {
    return api.post(`/api/papers/${paperId}/publish`, { version });
  },
  duplicate(paperId: string) {
    return api.post(`/api/papers/${paperId}/duplicate`);
  },
  remove(paperId: string) {
    return api.delete(`/api/papers/${paperId}`);
  },
  importMarkdown(markdownText: string) {
    const formData = new FormData();
    formData.append('markdown_text', markdownText);
    return api.post('/api/papers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const scheduleApi = {
  createAssignment(sessionId: string, payload: ScheduleAssignment) {
    return api.post(`/api/sessions/${sessionId}/assignments`, payload);
  },
  updateAssignment(sessionId: string, assignmentId: string, payload: ScheduleAssignment) {
    return api.put(`/api/sessions/${sessionId}/assignments/${assignmentId}`, payload);
  },
  deleteAssignment(sessionId: string, assignmentId: string) {
    return api.delete(`/api/sessions/${sessionId}/assignments/${assignmentId}`);
  },
};
