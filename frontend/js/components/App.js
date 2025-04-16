import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import ScriptList from './ScriptList.js';
import ScriptOutput from './ScriptOutput.js';
import ScriptDetails from './ScriptDetails.js';
import Sources from './Sources.js';
import Config from './Config.js';
import * as configService from '../services/configService.js';

const app = createApp({
  name: 'App',
  components: {
    ScriptList,
    ScriptOutput,
    ScriptDetails,
    Sources,
    Config
  },
  template: `
    <div class="w-full p-4 pb-6 flex flex-col h-[100vh]">
      <h1 class="text-3xl font-bold mb-2">Script Manager</h1>

      <!-- Navigation -->
      <div class="mb-2">
        <nav class="flex gap-4">
          <button
            @click="currentView = 'scripts'"
            :class="['px-4 py-2 rounded', currentView === 'scripts' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
          >
            Scripts
          </button>
          <button
            @click="currentView = 'sources'"
            :class="['px-4 py-2 rounded', currentView === 'sources' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
          >
            Sources
          </button>
          <button
            @click="currentView = 'config'"
            :class="['px-4 py-2 rounded', currentView === 'config' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
          >
            Config
          </button>
        </nav>
      </div>

      <!-- Main Content -->
      <div v-if="currentView === 'scripts'" class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden h-full w-full">
        <div class="flex flex-col h-full overflow-auto">
          <div class="flex-shrink-0">
            <ScriptList @script-selected="selectScript" />
            <ScriptDetails
              v-if="selectedScript"
              :script="selectedScript"
              @execute="executeScript"
              @close="selectedScript = null"
              class="mt-4"
            />
          </div>
        </div>
        <div class="h-full overflow-hidden w-full">
          <ScriptOutput :output="output" @clear="clearOutput" />
        </div>
      </div>
      <div v-else-if="currentView === 'sources'" class="flex-grow overflow-auto">
        <Sources />
      </div>
      <div v-else-if="currentView === 'config'" class="flex-grow overflow-auto">
        <Config />
      </div>
    </div>
  `,
  setup() {
    const output = ref([]);
    const currentView = ref('scripts');
    const selectedScript = ref(null);

    const selectScript = (script) => {
      selectedScript.value = script;
    };

    const executeScript = ({ script, args, config }) => {
      output.value = [];
      let host = location.origin.replace('http://', 'ws://');
      const ws = new WebSocket(`${host}/ws`);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // Add timestamp to each message
        message.timestamp = new Date().toLocaleTimeString();
        output.value.push(message);
      };

      ws.onopen = () => {
        // If args were provided, add them to the config
        if (args) {
          config.args = args;
        }

        ws.send(JSON.stringify({
          type: 'run',
          script,
          config
        }));
      };

      ws.onerror = (error) => {
        output.value.push({
          type: 'error',
          data: `WebSocket error: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString()
        });
      };
    };

    const clearOutput = () => {
      output.value = [];
    };

    return {
      output,
      currentView,
      selectedScript,
      selectScript,
      executeScript,
      clearOutput
    };
  }
});

app.mount('#app');