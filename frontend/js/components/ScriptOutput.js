export default {
  name: 'ScriptOutput',
  props: {
    output: {
      type: Array,
      required: true
    }
  },
  template: `
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Output</h2>
      <div class="bg-gray-900 text-white p-4 rounded font-mono h-96 overflow-auto">
        <div v-for="(line, index) in output" :key="index" :class="lineClass(line)">
          {{ line.data }}
        </div>
      </div>
    </div>
  `,
  methods: {
    lineClass(line) {
      return {
        'text-red-400': line.type === 'error',
        'text-green-400': line.type === 'exit',
        'text-white': line.type === 'output'
      };
    }
  }
};