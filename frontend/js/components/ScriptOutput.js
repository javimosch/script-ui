import { ref, watch, nextTick } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
  name: 'ScriptOutput',
  props: {
    output: {
      type: Array,
      required: true
    }
  },
  emits: ['clear'],
  template: `
    <div class="bg-white p-4 rounded-lg shadow h-full flex flex-col overflow-hidden w-full">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Output</h2>
        <button
          @click="$emit('clear')"
          class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          :disabled="output.length === 0"
          :class="{ 'opacity-50 cursor-not-allowed': output.length === 0 }"
        >
          Clear
        </button>
      </div>
      <div ref="outputContainer" class="bg-gray-900 text-white p-4 rounded font-mono flex-grow overflow-y-auto whitespace-pre-wrap leading-relaxed text-sm h-[calc(100%-3rem)] w-full">
        <div
          v-for="(line, index) in output"
          :key="index"
          class="mb-2"
        >
          <div class="flex items-start">
            <span class="text-xs text-gray-500 mr-2 whitespace-nowrap">{{ line.timestamp || '' }}</span>
            <div :class="lineClass(line)" v-html="formatOutput(line.data)"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup(props) {
    const outputContainer = ref(null);

    // Watch for changes to the output array and scroll to bottom
    watch(() => props.output.length, async () => {
      if (outputContainer.value) {
        // Wait for the DOM to update before scrolling
        await nextTick();
        outputContainer.value.scrollTop = outputContainer.value.scrollHeight;
      }
    });

    return {
      outputContainer
    };
  },
  methods: {
    lineClass(line) {
      return {
        'text-red-400': line.type === 'error',
        'text-green-400': line.type === 'exit',
        'text-white': line.type === 'output'
      };
    },
    formatOutput(text) {
      if (!text) return '';

      // Escape HTML to prevent XSS
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Replace newlines with <br> tags
      return escaped.replace(/\n/g, '<br>');
    }
  }
};