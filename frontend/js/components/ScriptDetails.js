import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import * as configService from '../services/configService.js';

export default {
  name: 'ScriptDetails',
  props: {
    script: {
      type: String,
      required: true
    }
  },
  emits: ['execute', 'close'],
  template: `
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold">{{ script }}</h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div class="mb-4">
        <div class="text-sm text-gray-500 mb-1">Script Type: {{ scriptType }}</div>

        <!-- Script Arguments -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Arguments</label>
          <input
            v-model="args"
            class="w-full rounded border-gray-300"
            placeholder="Enter script arguments"
          >
          <p class="text-xs text-gray-500 mt-1">Override default arguments for this execution</p>
        </div>

        <!-- Environment Variables -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Environment Variables</label>
            <button
              @click="showEnvVars = !showEnvVars"
              class="text-xs text-blue-500 hover:text-blue-700"
            >
              {{ showEnvVars ? 'Hide' : 'Show' }}
            </button>
          </div>

          <div v-if="showEnvVars" class="border rounded p-2 mb-2 text-sm bg-gray-50">
            <div v-for="(value, key) in mergedEnv" :key="key" class="mb-1">
              <span class="font-mono">{{ key }}={{ value }}</span>
            </div>
            <div v-if="Object.keys(mergedEnv).length === 0" class="text-gray-500">
              No environment variables configured
            </div>
          </div>
        </div>

        <!-- Permissions (for Deno) -->
        <div v-if="scriptType === 'deno'" class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Deno Permissions</label>
            <button
              @click="showPermissions = !showPermissions"
              class="text-xs text-blue-500 hover:text-blue-700"
            >
              {{ showPermissions ? 'Hide' : 'Show' }}
            </button>
          </div>

          <div v-if="showPermissions" class="border rounded p-2 text-sm bg-gray-50">
            <div v-for="(value, perm) in permissions" :key="perm" class="mb-1">
              <span class="font-mono">{{ formatPermission(perm) }}: {{ value ? 'Enabled' : 'Disabled' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="executeScript"
          class="btn btn-primary"
        >
          Execute
        </button>
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const scriptConfig = ref({ permissions: {}, env: {}, args: '' });
    const args = ref('');
    const showEnvVars = ref(false);
    const showPermissions = ref(false);
    const mergedEnvData = ref({});

    const scriptType = computed(() => {
      return configService.getScriptType(props.script);
    });

    const mergedEnv = computed(() => {
      return mergedEnvData.value;
    });

    const permissions = computed(() => {
      return scriptConfig.value.permissions || {};
    });

    const formatPermission = (perm) => {
      return perm.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('allow', 'Allow');
    };

    const loadScriptConfig = async () => {
      try {
        const config = await configService.getScriptConfig(props.script);
        scriptConfig.value = config;
        args.value = config.args || '';

        // Load merged environment variables
        mergedEnvData.value = await configService.getMergedEnv(props.script);
      } catch (error) {
        console.error(`Failed to load script config for ${props.script}:`, error);
      }
    };

    const executeScript = async () => {
      try {
        const denoFlags = await configService.getDenoFlags(props.script);
        const env = await configService.getMergedEnv(props.script);

        emit('execute', {
          script: props.script,
          args: args.value,
          config: {
            denoFlags,
            env
          }
        });
      } catch (error) {
        console.error(`Failed to execute script ${props.script}:`, error);
      }
    };

    // Initial load
    loadScriptConfig();

    // Update when script changes
    watch(() => props.script, () => {
      loadScriptConfig();
    });

    return {
      args,
      scriptType,
      mergedEnv,
      permissions,
      showEnvVars,
      showPermissions,
      formatPermission,
      executeScript
    };
  }
};
