import { ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
  name: 'ScriptList',
  template: `
    <div 
      class="bg-white p-4 rounded-lg shadow"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <h2 class="text-xl font-semibold mb-4">Available Scripts</h2>
      
      <!-- Upload UI -->
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center hover:border-gray-400 transition-colors"
        :class="{ 'border-blue-500 bg-blue-50': isDragging }"
      >
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".js,.sh"
          class="hidden"
          multiple
        >
        <button 
          @click="$refs.fileInput.click()"
          class="btn btn-primary mb-2"
        >
          Choose Files
        </button>
        <p class="text-sm text-gray-600">or drag and drop script files here</p>
      </div>

      <!-- Scripts List -->
      <div class="space-y-2">
        <div
          v-for="script in scripts"
          :key="script"
          class="flex items-center gap-2"
        >
          <button
            @click="$emit('script-selected', script)"
            class="flex-grow text-left px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            {{ script }}
          </button>
          <button
            @click="confirmDelete(script)"
            class="px-2 py-2 rounded text-red-600 hover:bg-red-100"
            title="Delete script"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const scripts = ref([]);
    const isDragging = ref(false);
    const fileInput = ref(null);

    const fetchScripts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/scripts');
        scripts.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      }
    };

    const uploadFiles = async (files) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('scripts', file);
      }

      try {
        const response = await fetch('http://localhost:3000/api/scripts/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          await fetchScripts(); // Refresh the list
        } else {
          console.error('Upload failed:', await response.text());
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    };

    const deleteScript = async (script) => {
      try {
        const response = await fetch(`http://localhost:3000/api/scripts/${encodeURIComponent(script)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchScripts(); // Refresh the list
        } else {
          console.error('Delete failed:', await response.text());
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    };

    const confirmDelete = (script) => {
      if (confirm(`Are you sure you want to delete "${script}"?`)) {
        deleteScript(script);
      }
    };

    const handleFileSelect = (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        uploadFiles(files);
      }
    };

    const handleDrop = (event) => {
      isDragging.value = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        uploadFiles(files);
      }
    };

    // Drag events
    const handleDragEvents = (event) => {
      event.preventDefault();
      isDragging.value = event.type === 'dragenter' || event.type === 'dragover';
    };

    onMounted(() => {
      fetchScripts();
      
      // Setup drag event listeners
      const el = document.querySelector('.bg-white');
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        el.addEventListener(eventName, handleDragEvents);
      });
    });

    return {
      scripts,
      isDragging,
      fileInput,
      handleFileSelect,
      handleDrop,
      confirmDelete
    };
  }
};