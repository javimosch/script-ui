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

        <!-- Script Selection -->
        <div class="mb-4">
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
    const selectedScript = ref('');
    const scriptConfig = ref({ permissions: {}, env: {} });
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

    const loadGlobalEnv = () => {
      const env = configService.getGlobalEnv();
      globalEnv.value = Object.entries(env).reduce((acc, [key, value], index) => {
        acc[index] = { key, value };
        return acc;
      }, {});
    };

    const loadScriptConfig = () => {
      if (!selectedScript.value) return;

      const config = configService.getScriptConfig(selectedScript.value);
      scriptConfig.value = config;

      scriptEnv.value = Object.entries(config.env || {}).reduce((acc, [key, value], index) => {
        acc[index] = { key, value };
        return acc;
      }, {});
    };

    const saveScriptConfig = () => {
      const envObj = Object.values(scriptEnv.value).reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {});

      configService.updateScriptConfig(selectedScript.value, {
        permissions: scriptConfig.value.permissions,
        env: envObj,
        args: scriptConfig.value.args || ''
      });
    };

    const saveGlobalEnv = () => {
      const envObj = Object.values(globalEnv.value).reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {});

      configService.updateGlobalEnv(envObj);
    };

    const addGlobalEnv = () => {
      const newIndex = Object.keys(globalEnv.value).length;
      globalEnv.value[newIndex] = { key: '', value: '' };
    };

    const removeGlobalEnv = (index) => {
      delete globalEnv.value[index];
      saveGlobalEnv();
    };

    const updateGlobalEnvKey = (index, newKey) => {
      globalEnv.value[index].key = newKey;
      saveGlobalEnv();
    };

    const addScriptEnv = () => {
      const newIndex = Object.keys(scriptEnv.value).length;
      scriptEnv.value[newIndex] = { key: '', value: '' };
    };

    const removeScriptEnv = (index) => {
      delete scriptEnv.value[index];
      saveScriptConfig();
    };

    const updateScriptEnvKey = (index, newKey) => {
      scriptEnv.value[index].key = newKey;
      saveScriptConfig();
    };

    const formatPermission = (perm) => {
      return perm.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('allow', 'Allow');
    };

    onMounted(() => {
      fetchScripts();
      loadGlobalEnv();
    });

    watch(selectedScript, () => {
      loadScriptConfig();
    });

    watch(globalEnv, () => {
      saveGlobalEnv();
    }, { deep: true });

    watch(scriptEnv, () => {
      saveScriptConfig();
    }, { deep: true });

    return {
      scripts,
      selectedScript,
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