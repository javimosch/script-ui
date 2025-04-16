import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import ScriptList from './ScriptList.js';
import ScriptOutput from './ScriptOutput.js';
import Sources from './Sources.js';

const app = createApp({
  name: 'App',
  components: {
    ScriptList,
    ScriptOutput,
    Sources
  },
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Script Manager</h1>
      
      <!-- Navigation -->
      <div class="mb-4">
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
        </nav>
      </div>

      <!-- Main Content -->
      <div v-if="currentView === 'scripts'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScriptList @script-selected="runScript" />
        <ScriptOutput :output="output" />
      </div>
      <div v-else-if="currentView === 'sources'">
        <Sources />
      </div>
    </div>
  `,
  setup() {
    const output = ref([]);
    const currentView = ref('scripts');

    const runScript = (script) => {
      output.value = [];
      const ws = new WebSocket('ws://localhost:3000/ws');
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        output.value.push(message);
      };
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'run', script }));
      };
    };

    return {
      output,
      currentView,
      runScript
    };
  }
});

app.mount('#app');