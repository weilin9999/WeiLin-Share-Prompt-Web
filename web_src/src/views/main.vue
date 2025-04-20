<template>
    <div v-if="showError" class="error-message">
        {{ errorMessage }}
    </div>
    <div>
        <button @click="exportSQL">导出SQL</button>
        <button style="margin-left: 10px;" @click="triggerFileUpload" class="upload-btn">上传原始SQL文件</button>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".sql" style="display: none;" />
        <input type="file" ref="jsonFileInput" @change="handleJSONUpload" accept=".json" style="display: none;" />
        <input type="file" ref="txtFileInput" @change="handleTXTUpload" accept=".txt" style="display: none;" />
    </div>
    <div>
        <input v-model="groupName" placeholder="一级分类名称" />
        <button @click="generateGroupSQL">设置一级分类</button>

        <input style="width: 300px;margin-left: 10px;" v-model="mainClassUUID" placeholder="一级分原UUID，增量更新才需要" />
    </div>
    <div>
        <input v-model="subGroupName" placeholder="二级分类名称" />
        <button @click="generateSubGroupSQL">设置二级分类</button>

        <input style="width: 300px;margin-left: 10px" v-model="subGroupUUID" placeholder="二级分原UUID，增量更新才需要" />
    </div>
    <div>
        <input v-model="tag" placeholder="Tag" />
        <input v-model="chinese" placeholder="中文" />
        <button @click="generateSQL">添加Tag</button>
        <button style="margin-left: 10px;" @click="triggerJSONUpload" class="upload-btn">从JSON文件导入Tag</button>
        <button style="margin-left: 10px;" @click="triggerTXTUpload" class="upload-btn">从txt文件批量导入tag</button>
    </div>
    <div class="data-container">
        <div v-if="groupSql">
            <h3>{{ parseSQL(groupSql).text }}</h3>
            <div v-if="subGroupSql">
                <h4>{{ parseSQL(subGroupSql).text }}</h4>
                <div class="tag-group-container">
                    <div v-for="(tag, index) in tagGroups" :key="index">
                        <p>{{ parseSQL(tag).text }} - {{ parseSQL(tag).desc }}</p>
                        <div v-if="editingIndex === index">
                            <input v-model="editText" placeholder="Tag名称" />
                            <input v-model="editDesc" placeholder="描述" />
                            <button @click="confirmEdit(index)">确认</button>
                            <button style="margin-left: 10px;" @click="cancelEdit">取消</button>
                        </div>
                        <button v-else @click="startEdit(index)">编辑</button>
                        <button style="margin-left: 10px;" @click="deleteTag(index)">删除</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { uuidv7 } from "uuidv7";

const tag = ref('')
const chinese = ref('')
const sql = ref('')
const groupSql = ref('')
const subGroupSql = ref('')
const groupName = ref('')
const subGroupName = ref('')
const mainClassUUID = ref('')
const subGroupUUID = ref('')
const showError = ref(false)
const errorMessage = ref('')
const tagGroups = ref([])
const editingIndex = ref(-1)
const editText = ref('')
const editDesc = ref('')

function handleTXTUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());
            lines.forEach(line => {
                const [text, desc] = line.split(',');
                if (text && desc) {
                    const escapedText = text.trim().replace(/'/g, "''");
                    const escapedDesc = desc.trim().replace(/'/g, "''");
                    const result = uuidv7();
                    const sql = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${escapedText}', '${escapedDesc}', 'rgba(255, 123, 2, .4)', 0, '${subGroupUUID.value}', '${result}');`
                    tagGroups.value.push(sql);
                }
            });
        };
        reader.readAsText(file);
    }
}

function handleJSONUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                Object.entries(jsonData).forEach(([text, desc]) => {
                    const escapedText = text.replace(/'/g, "''");
                    const escapedDesc = desc.replace(/'/g, "''");
                    const result = uuidv7();
                    const sql = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${escapedText}', '${escapedDesc}', 'rgba(255, 123, 2, .4)', 0, '${subGroupUUID.value}', '${result}');`
                    tagGroups.value.push(sql);
                });
            } catch (error) {
                showError.value = true;
                errorMessage.value = 'JSON文件格式错误';
                setTimeout(() => {
                    showError.value = false;
                }, 3000);
            }
        };
        reader.readAsText(file);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const sqlStatements = content.split(';').filter(s => s.trim());
            sqlStatements.forEach(statement => {
                if ((statement.includes('tag_groups') || statement.includes('tag_subgroups')) && statement.includes('p_uuid')) {
                    if (statement.includes('g_uuid')) {
                        // 处理二级分类
                        subGroupSql.value = statement + ';';
                        // 提取g_uuid，使用更灵活的正则表达式
                        const valuesPart = statement.split("VALUES")[1].trim();
                        const lastValue = valuesPart.match(/,\s*'([^']+)'\)$/);
                        if (lastValue) subGroupUUID.value = lastValue[1];
                        const nameMatch = statement.match(/VALUES\s*\([^'"]*['"]([^'"]+)['"]/);
                        if (nameMatch) subGroupName.value = nameMatch[1].replace(/''/g, "'");
                    } else {
                        // 处理一级分类
                        groupSql.value = statement + ';';
                        // 提取p_uuid，使用更灵活的正则表达式
                        const valuesPart = statement.split('VALUES')[1].trim();
                        const lastValue = valuesPart.match(/,\s*'([^']+)'\)$/);
                        if (lastValue) mainClassUUID.value = lastValue[1];
                        const nameMatch = statement.match(/VALUES\s*\([^'"]*['"]([^'"]+)['"]/);
                        if (nameMatch) groupName.value = nameMatch[1].replace(/''/g, "'");
                    }
                } else if (statement.includes('tag_tags')) {
                    tagGroups.value.push(statement + ';');
                }
            });
        };
        reader.readAsText(file);
    }
}

function triggerTXTUpload() {
    const fileInput = document.querySelector('input[type="file"][accept=".txt"]');
    fileInput.click();
}

function triggerJSONUpload() {
    const fileInput = document.querySelector('input[type="file"][accept=".json"]');
    fileInput.click();
}

function triggerFileUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    fileInput.click();
}

function exportSQL() {
    const sqlContent = [groupSql.value, subGroupSql.value, ...tagGroups.value].join('\n');
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'export.sql';
    link.click();
}

function parseSQL(sql) {
    const textMatch = sql.match(/VALUES\s*\([^']*'([^']+)'/);
    const descMatch = sql.match(/VALUES\s*\([^']*'[^']*'\s*,\s*'([^']+)'/);
    return {
        text: textMatch ? textMatch[1].replace(/''/g, "'") : '',
        desc: descMatch ? descMatch[1].replace(/''/g, "'") : ''
    }
}

function deleteTag(index) {
    tagGroups.value.splice(index, 1);
}

function startEdit(index) {
    const tag = tagGroups.value[index];
    const parsed = parseSQL(tag);
    editText.value = parsed.text;
    editDesc.value = parsed.desc;
    editingIndex.value = index;
}

function confirmEdit(index) {
    const escapedText = editText.value.replace(/'/g, "''");
    const escapedDesc = editDesc.value.replace(/'/g, "''");
    tagGroups.value[index] = tagGroups.value[index].replace(/(VALUES\s*\([^']*')([^']+)'/, `$1${escapedText}'`).replace(/(VALUES\s*\([^']*'[^']*'\s*,\s*')([^']+)'/, `$1${escapedDesc}'`);
    editingIndex.value = -1;
}

function cancelEdit() {
    editingIndex.value = -1;
}

function generateSQL() {
    if (!subGroupUUID.value) {
        showError.value = true
        errorMessage.value = '请先添加二级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    const escapedTag = tag.value.replace(/'/g, "''")
    const escapedChinese = chinese.value.replace(/'/g, "''")
    const result = uuidv7();
    sql.value = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${escapedTag}', '${escapedChinese}', 'rgba(255, 123, 2, .4)', 0, '${subGroupUUID.value}', '${result}');`
    tagGroups.value.push(sql.value)
    showError.value = false
}

function generateGroupSQL() {
    const escapedGroupName = groupName.value.replace(/'/g, "''")
    if (mainClassUUID.value.length <= 0){
        mainClassUUID.value = uuidv7();
    }
    groupSql.value = `INSERT OR REPLACE INTO "tag_groups" ("name", "color", "create_time", "p_uuid") VALUES ('${escapedGroupName}', 'rgba(255, 123, 2, .4)', 0, '${mainClassUUID.value}');`
}

function generateSubGroupSQL() {
    if (!mainClassUUID.value) {
        showError.value = true
        errorMessage.value = '请先添加一级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    const escapedSubGroupName = subGroupName.value.replace(/'/g, "''")
    if (subGroupUUID.value.length <= 0){
        subGroupUUID.value = uuidv7();
    }
    subGroupSql.value = `INSERT OR REPLACE INTO "tag_subgroups" ("name", "color", "create_time", "p_uuid", "g_uuid") VALUES ('${escapedSubGroupName}', 'rgba(255, 123, 2, .4)', 0, '${mainClassUUID.value}', '${subGroupUUID.value}');`
    showError.value = false
}
</script>

<style scoped>
.error-message {
    padding: 10px;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin-bottom: 20px;
}

div {
    margin-bottom: 16px;
}

input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 8px;
}

button {
    padding: 8px 16px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #1976d2;
}

.data-container {
    margin-top: 24px;
    padding: 16px;
    background-color: #f5f5f5;
    border-radius: 4px;
    height: 500px;
    overflow: hidden;
}

.tag-group-container {
    height: 430px;
    overflow-y: auto;
}

h3,
h4 {
    margin: 8px 0;
}

p {
    margin: 4px 0;
}
</style>