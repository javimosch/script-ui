import { ref, onMounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import * as configService from '../services/configService.js';

export default {
  name: 'Config',
  template: `
    <div class="space-y-6">
      <!-- Global Environment Variables -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Global Environment Variables</h2>
        <div class="space-y-4">
          <div v-for="(value, key) in globalEnv" :key="key" class="flex gap-2">
            <input
              v-model="globalEnv[key].key"
              class="flex-1 rounded border-gray-300"
              placeholder="Key"
              @input="updateGlobalEnvKey(key, $event.target.value)"
            >
            <input
              v-model="globalEnv[key].value"
              class="flex-1 rounded border-gray-300"
              placeholder="Value"
            >
            <button
              @click="removeGlobalEnv(key)"
              class="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
            >
              ×
            </button>
          </div>
          <button
            @click="addGlobalEnv"
            class="btn btn-primary"
          >
            Add Environment Variable
          </button>
        </div>
      </div>

      <!-- Script Configurations -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Script Configurations</h2>

        <!-- Source and Script Selection -->
        <div class="mb-4 space-y-2">
          <!-- Source Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              v-model="selectedSource"
              class="w-full rounded border-gray-300"
            >
              <option v-for="source in sources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>
            </select>
          </div>

          <!-- Script Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Script</label>
            <select
              v-model="selectedScript"
              class="w-full rounded border-gray-300"
            >
              <option value="">Select a script...</option>
              <option v-for="script in scripts" :key="script" :value="script">
                {{ script }}
              </option>
            </select>
          </div>
        </div>

        <!-- Script Config -->
        <div v-if="selectedScript" class="space-y-6">
          <!-- Permissions -->
          <div>
            <h3 class="text-lg font-medium mb-2">Deno Permissions</h3>
            <div class="space-y-2">
              <label v-for="(value, perm) in scriptConfig.permissions" :key="perm" class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="scriptConfig.permissions[perm]"
                  class="rounded"
                >
                <span class="capitalize">{{ formatPermission(perm) }}</span>
              </label>
            </div>
          </div>

          <!-- Script Arguments -->
          <div>
            <h3 class="text-lg font-medium mb-2">Script Arguments</h3>
            <div class="mb-4">
              <input
                v-model="scriptConfig.args"
                class="w-full rounded border-gray-300"
                placeholder="Enter script arguments"
              >
              <p class="text-sm text-gray-500 mt-1">Arguments will be passed to the script when executed</p>
            </div>
          </div>

          <!-- Script Environment Variables -->
          <div>
            <h3 class="text-lg font-medium mb-2">Script Environment Variables</h3>
            <div class="space-y-4">
              <div v-for="(value, key) in scriptEnv" :key="key" class="flex gap-2">
                <input
                  v-model="scriptEnv[key].key"
                  class="flex-1 rounded border-gray-300"
                  placeholder="Key"
                  @input="updateScriptEnvKey(key, $event.target.value)"
                >
                <input
                  v-model="scriptEnv[key].value"
                  class="flex-1 rounded border-gray-300"
                  placeholder="Value"
                >
                <button
                  @click="removeScriptEnv(key)"
                  class="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  ×
                </button>
              </div>
              <button
                @click="addScriptEnv"
                class="btn btn-primary"
              >
                Add Environment Variable
              </button>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <button
              @click="saveScriptConfig"
              class="btn btn-primary"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const scripts = ref([]);
    const sources = ref([]);
    const selectedScript = ref('');
    const selectedSource = ref('default');
    const scriptConfig = ref({
      scriptName: '',
      sourceId: 'default',
      permissions: {},
      env: {}
    });
    const globalEnv = ref({});
    const scriptEnv = ref({});

    const fetchScripts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/scripts');
        scripts.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      }
    };

    const fetchSources = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sources');
        sources.value = await response.json();
        // Set default source if available
        const defaultSource = sources.value.find(s => s.isDefault);
        if (defaultSource) {
          selectedSource.value = defaultSource.id;
        }
      } catch (error) {
        console.error('Failed to fetch sources:', error);
      }
    };

    const loadGlobalEnv = async () => {
      try {
        const env = await configService.getGlobalEnv();
        globalEnv.value = Object.entries(env).reduce((acc, [key, value], index) => {
          acc[index] = { key, value };
          return acc;
        }, {});
      } catch (error) {
        console.error('Failed to load global environment variables:', error);
      }
    };

    const loadScriptConfig = async () => {
      if (!selectedScript.value) return;

      try {
        const config = await configService.getScriptConfig(selectedScript.value, selectedSource.value);
        scriptConfig.value = config;

        scriptEnv.value = Object.entries(config.env || {}).reduce((acc, [key, value], index) => {
          acc[index] = { key, value };
          return acc;
        }, {});
      } catch (error) {
        console.error(`Failed to load config for script ${selectedScript.value}:`, error);
      }
    };

    const saveScriptConfig = async () => {
      try {
        const envObj = Object.values(scriptEnv.value).reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {});

        await configService.updateScriptConfig(selectedScript.value, {
          permissions: scriptConfig.value.permissions,
          env: envObj,
          args: scriptConfig.value.args || ''
        }, selectedSource.value);
      } catch (error) {
        console.error(`Failed to save config for script ${selectedScript.value}:`, error);
      }
    };

    const saveGlobalEnv = async () => {
      try {
        const envObj = Object.values(globalEnv.value).reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {});

        await configService.updateGlobalEnv(envObj);
      } catch (error) {
        console.error('Failed to save global environment variables:', error);
      }
    };

    const addGlobalEnv = () => {
      const newIndex = Object.keys(globalEnv.value).length;
      globalEnv.value[newIndex] = { key: '', value: '' };
    };

    const removeGlobalEnv = async (index) => {
      delete globalEnv.value[index];
      await saveGlobalEnv();
    };

    const updateGlobalEnvKey = async (index, newKey) => {
      globalEnv.value[index].key = newKey;
      await saveGlobalEnv();
    };

    const addScriptEnv = () => {
      const newIndex = Object.keys(scriptEnv.value).length;
      scriptEnv.value[newIndex] = { key: '', value: '' };
    };

    const removeScriptEnv = async (index) => {
      delete scriptEnv.value[index];
      await saveScriptConfig();
    };

    const updateScriptEnvKey = async (index, newKey) => {
      scriptEnv.value[index].key = newKey;
      await saveScriptConfig();
    };

    const formatPermission = (perm) => {
      return perm.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('allow', 'Allow');
    };

    onMounted(async () => {
      await Promise.all([
        fetchScripts(),
        fetchSources(),
        loadGlobalEnv()
      ]);
    });

    watch([selectedScript, selectedSource], async () => {
      if (selectedScript.value) {
        await loadScriptConfig();
      }
    });

    // Use debounced watchers to avoid too many API calls
    let globalEnvTimeout = null;
    watch(globalEnv, () => {
      clearTimeout(globalEnvTimeout);
      globalEnvTimeout = setTimeout(() => {
        saveGlobalEnv();
      }, 500); // 500ms debounce
    }, { deep: true });

    let scriptEnvTimeout = null;
    watch(scriptEnv, () => {
      clearTimeout(scriptEnvTimeout);
      scriptEnvTimeout = setTimeout(() => {
        saveScriptConfig();
      }, 500); // 500ms debounce
    }, { deep: true });

    // Also watch scriptConfig for changes to permissions and args
    let scriptConfigTimeout = null;
    watch(scriptConfig, () => {
      if (!selectedScript.value) return;
      clearTimeout(scriptConfigTimeout);
      scriptConfigTimeout = setTimeout(() => {
        saveScriptConfig();
      }, 500); // 500ms debounce
    }, { deep: true });

    return {
      scripts,
      sources,
      selectedScript,
      selectedSource,
      scriptConfig,
      globalEnv,
      scriptEnv,
      addGlobalEnv,
      removeGlobalEnv,
      updateGlobalEnvKey,
      addScriptEnv,
      removeScriptEnv,
      updateScriptEnvKey,
      saveScriptConfig,
      formatPermission
    };
  }
};