import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import ScriptList from './ScriptList.js';
import ScriptOutput from './ScriptOutput.js';

const app = createApp({
  name: 'App',
  components: {
    ScriptList,
    ScriptOutput
  },
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Script Manager</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScriptList @script-selected="runScript" />
        <ScriptOutput :output="output" />
      </div>
    </div>
  `,
  data() {
    return {
      output: []
    }
  },
  methods: {
    runScript(script) {
      this.output = [];
      const ws = new WebSocket('ws://localhost:3000/ws');
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.output.push(message);
      };
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'run', script }));
      };
    }
  }
});

app.mount('#app');