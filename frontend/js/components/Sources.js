import { ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
  name: 'Sources',
  template: `
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Script Sources</h2>
      
      <!-- Add Source Form -->
      <form @submit.prevent="addSource" class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input 
              v-model="newSource.name" 
              type="text" 
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Source name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Path</label>
            <input 
              v-model="newSource.path" 
              type="text" 
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="/path/to/scripts"
            >
          </div>
          <button 
            type="submit"
            class="btn btn-primary"
          >
            Add Source
          </button>
        </div>
      </form>

      <!-- Sources List -->
      <div class="space-y-4">
        <div v-for="source in sources" :key="source.id" class="border rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium">{{ source.name }}</h3>
              <p class="text-sm text-gray-500">{{ source.path }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                v-if="!source.isDefault"
                @click="editSource(source)"
                class="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button 
                v-if="!source.isDefault"
                @click="confirmDelete(source)"
                class="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
              <span v-if="source.isDefault" class="text-sm text-gray-500">Default</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="editingSource" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 class="text-lg font-medium mb-4">Edit Source</h3>
          <form @submit.prevent="updateSource">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input 
                  v-model="editingSource.name" 
                  type="text" 
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Path</label>
                <input 
                  v-model="editingSource.path" 
                  type="text" 
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
              </div>
              <div class="flex justify-end gap-2">
                <button 
                  type="button"
                  @click="editingSource = null"
                  class="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  class="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    const sources = ref([]);
    const newSource = ref({ name: '', path: '' });
    const editingSource = ref(null);

    const fetchSources = async () => {
      try {
        const response = await fetch(window.location.origin+'/api/sources');
        sources.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch sources:', error);
      }
    };

    const addSource = async () => {
      try {
        const response = await fetch(window.location.origin+'/api/sources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newSource.value)
        });
        
        if (response.ok) {
          await fetchSources();
          newSource.value = { name: '', path: '' };
        } else {
          console.error('Failed to add source:', await response.text());
        }
      } catch (error) {
        console.error('Error adding source:', error);
      }
    };

    const editSource = (source) => {
      editingSource.value = { ...source };
    };

    const updateSource = async () => {
      try {
        const response = await fetch(window.location.origin+`/api/sources/${editingSource.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: editingSource.value.name,
            path: editingSource.value.path
          })
        });
        
        if (response.ok) {
          await fetchSources();
          editingSource.value = null;
        } else {
          console.error('Failed to update source:', await response.text());
        }
      } catch (error) {
        console.error('Error updating source:', error);
      }
    };

    const confirmDelete = async (source) => {
      if (confirm(`Are you sure you want to delete "${source.name}"?`)) {
        try {
          const response = await fetch(window.location.origin+`/api/sources/${source.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            await fetchSources();
          } else {
            console.error('Failed to delete source:', await response.text());
          }
        } catch (error) {
          console.error('Error deleting source:', error);
        }
      }
    };

    onMounted(fetchSources);

    return {
      sources,
      newSource,
      editingSource,
      addSource,
      editSource,
      updateSource,
      confirmDelete
    };
  }
};