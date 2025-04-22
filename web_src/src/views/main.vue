<template>
    <div class="app-container">
        <div v-if="showError" class="error-message">
            <div class="error-msg-box">
                <i class="error-icon">!</i>
                {{ errorMessage }}
            </div>
        </div>

        <!-- 头部信息区域 -->
        <div class="header-section">
            <div class="app-title">WeiLin Tag 在线批量编辑器 <span class="version-badge">版本V1.1.0</span></div>
            <div class="info-links">
                <div class="info-link-item">
                    <span class="info-link-label">使用教程</span>
                    <a href="https://www.bilibili.com/list/288025756/?sid=4690314&spm_id_from=333.1387.0.0&oid=114342431298474&bvid=BV1txdfYxE7X"
                        target="_blank" class="info-link">
                        <i class="link-icon">📺</i> B站视频教程
                    </a>
                </div>
                <div class="info-link-item">
                    <span class="info-link-label">共享云仓库协作</span>
                    <a href="https://github.com/weilin9999/WeiLin-Comfyui-Tools-Prompt" target="_blank"
                        class="info-link">
                        <i class="link-icon">📦</i> 共享云仓库
                    </a>
                </div>
                <div class="info-link-item">
                    <span class="info-link-label">编辑器开源地址</span>
                    <a href="https://github.com/weilin9999/WeiLin-Share-Prompt-Web" target="_blank"
                        class="info-link">
                        <i class="link-icon">🔌</i> 在线编辑器
                    </a>
                </div>
            </div>
        </div>

        <!-- 操作区域 -->
        <div class="action-panel">
            <div class="panel-section">
                <div class="section-title">文件操作</div>
                <div class="button-group">
                    <button @click="cleanAll" class="upload-btn danger-btn">
                        <i class="btn-icon">🗑️</i> 清空所有
                    </button>
                    <button @click="triggerFileUpload" class="upload-btn">
                        <i class="btn-icon">📤</i> 上传原始SQL文件
                    </button>
                    <button @click="exportSQL" class="primary-btn">
                        <i class="btn-icon">💾</i> 导出所有SQL
                    </button>
                    <button @click="exportOnlyTagSQL" class="primary-btn">
                        <i class="btn-icon">📋</i> 仅导出Tag的SQL
                    </button>
                </div>
                <div class="input-group">
                    <label class="input-label">导出文件名</label>
                    <input class="full-width" v-model="outPutName" placeholder="设置导出文件名称" />
                </div>

                <!-- 隐藏的文件输入 -->
                <input type="file" ref="fileInput" @change="handleFileUpload" accept=".sql" style="display: none;" />
                <input type="file" ref="jsonFileInput" @change="handleJSONUpload" accept=".json"
                    style="display: none;" />
                <input type="file" ref="txtFileInput" @change="handleTXTUpload" accept=".txt" style="display: none;" />
                <input type="file" ref="yamlFileInput" @change="handleYAMLUpload" accept=".yaml,.yml"
                    style="display: none;" />
            </div>

            <!-- 分类设置区域 -->
            <div class="panel-section">
                <div class="section-title">分类设置</div>
                <div class="input-group">
                    <label class="input-label">一级分类</label>
                    <div class="flex-row">
                        <input v-model="groupName" placeholder="一级分类名称" />
                        <button @click="generateGroupSQL" class="primary-btn">设置一级分类</button>
                    </div>
                    <input class="full-width uuid-input" v-model="mainClassUUID" placeholder="一级分原UUID，增量更新才需要" />
                </div>

                <div class="input-group">
                    <label class="input-label">二级分类</label>
                    <div class="flex-row">
                        <input v-model="subGroupName" placeholder="二级分类名称" />
                        <button @click="generateSubGroupSQL" class="primary-btn">设置二级分类</button>
                    </div>
                    <input class="full-width uuid-input" v-model="subGroupUUID" placeholder="二级分原UUID，增量更新才需要" />
                </div>
            </div>

            <!-- Tag添加区域 -->
            <div class="panel-section">
                <div class="section-title">Tag 添加</div>
                <div class="input-group">
                    <div class="flex-row">
                        <input v-model="tag" placeholder="Tag" />
                        <input v-model="chinese" placeholder="中文" />
                        <button @click="generateSQL" class="primary-btn">添加Tag</button>
                    </div>
                </div>

                <div class="button-group">
                    <button @click="triggerJSONUpload" class="upload-btn">
                        <i class="btn-icon">📄</i> 从JSON文件批量导入
                    </button>
                    <button @click="triggerTXTUpload" class="upload-btn">
                        <i class="btn-icon">📝</i> 从TXT文件批量导入
                    </button>
                    <button @click="triggerYAMLUpload" class="upload-btn">
                        <i class="btn-icon">📋</i> 从YAML文件批量导入
                    </button>
                </div>
            </div>
        </div>

        <!-- 数据展示区域 -->
        <div class="data-container">
            <div v-if="groupSql" class="data-content">
                <h3>
                    <i class="category-icon">📂</i> {{ parseSQL(groupSql).text }}
                </h3>
                <div v-if="subGroupSql" class="subcategory-section">
                    <h4>
                        <i class="subcategory-icon">📁</i> {{ parseSQL(subGroupSql).text }}
                    </h4>
                    <div class="tag-group-container">
                        <div v-for="(tag, index) in tagGroups" :key="index" class="tag-item">
                            <p class="tag-text">
                                <i class="tag-icon">🏷️</i> {{ parseSQL(tag).text }} - {{ parseSQL(tag).desc }}
                            </p>
                            <div v-if="editingIndex === index" class="edit-controls">
                                <input v-model="editText" placeholder="Tag名称" />
                                <input v-model="editDesc" placeholder="描述" />
                                <div class="button-group compact">
                                    <button @click="confirmEdit(index)" class="success-btn">确认</button>
                                    <button @click="cancelEdit" class="cancel-btn">取消</button>
                                </div>
                            </div>
                            <div v-else class="tag-controls">
                                <button @click="startEdit(index)" class="edit-btn">
                                    <i class="btn-icon">✏️</i> 编辑
                                </button>
                                <button @click="deleteTag(index)" class="delete-btn">
                                    <i class="btn-icon">🗑️</i> 删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">请先设置一级分类和二级分类</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { uuidv7 } from "uuidv7";
import yaml from 'js-yaml';

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
const outPutName = ref('')
const fileInput = ref(null)
const jsonFileInput = ref(null)
const txtFileInput = ref(null)

const yamlFileInput = ref(null)

function triggerYAMLUpload() {
    if (groupSql.value.length <= 0 || subGroupSql.value.length <= 0) {
        showError.value = true
        errorMessage.value = '请先填写完整的一级和二级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    yamlFileInput.value.click();
}

function cleanAll() {
    tag.value = ''
    chinese.value = ''
    sql.value = ''
    groupSql.value = ''
    subGroupSql.value = ''
    groupName.value = ''
    subGroupName.value = ''
    mainClassUUID.value = ''
    subGroupUUID.value = ''
    tagGroups.value = []
    editingIndex.value = -1
    editText.value = ''
    editDesc.value = ''
}

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
    event.target.value = '';
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
    event.target.value = '';
}


function handleYAMLUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const yamlData = yaml.load(e.target.result);
                let i = 0;
                Object.entries(yamlData).forEach(([text, desc]) => {
                    const escapedText = text.replace(/'/g, "''");
                    const escapedDesc = String(desc).replace(/'/g, "''");
                    const result = uuidv7();
                    i = i + 1;
                    const time = parseInt(new Date().getTime() / 1000) + i;
                    const sql = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${escapedText}', '${escapedDesc}', 'rgba(255, 123, 2, .4)', ${time}, '${subGroupUUID.value}', '${result}');`
                    tagGroups.value.push(sql);
                });
            } catch (error) {
                showError.value = true;
                errorMessage.value = 'YMAL文件格式错误';
                setTimeout(() => {
                    showError.value = false;
                }, 3000);
            }
        };
        reader.readAsText(file);
    }
    event.target.value = '';
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
    event.target.value = '';
}

function triggerTXTUpload() {
    if (groupSql.value.length <= 0 || subGroupSql.value.length <= 0) {
        showError.value = true
        errorMessage.value = '请先填写完整的一级和二级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    txtFileInput.value.click();
}

function triggerJSONUpload() {
    if (groupSql.value.length <= 0 || subGroupSql.value.length <= 0) {
        showError.value = true
        errorMessage.value = '请先填写完整的一级和二级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    jsonFileInput.value.click();
}

function triggerFileUpload() {
    fileInput.value.click();
}

function exportSQL() {
    const sqlContent = [groupSql.value, subGroupSql.value, ...tagGroups.value].join('\n');
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    if (outPutName.value.length <= 0) {
        const time = parseInt(new Date().getTime() / 1000);
        link.download = 'export_' + time + '.sql';
    } else {
        link.download = outPutName.value + '.sql';
    }
    link.click();
}


const exportOnlyTagSQL = () => {
    const sqlContent = [...tagGroups.value].join('\n');
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    if (outPutName.value.length <= 0) {
        const time = parseInt(new Date().getTime() / 1000);
        link.download = 'export_tags_' + time + '.sql';
    } else {
        link.download = outPutName.value + '.sql';
    }
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
    if (groupName.value.length <= 0) {
        showError.value = true
        errorMessage.value = '请填写一级分类名称'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    const escapedGroupName = groupName.value.replace(/'/g, "''")
    if (mainClassUUID.value.length <= 0) {
        mainClassUUID.value = uuidv7();
    }
    groupSql.value = `INSERT OR REPLACE INTO "tag_groups" ("name", "color", "create_time", "p_uuid") VALUES ('${escapedGroupName}', 'rgba(255, 123, 2, .4)', 0, '${mainClassUUID.value}');`
}

function generateSubGroupSQL() {
    if (subGroupName.value.length <= 0) {
        showError.value = true
        errorMessage.value = '请填写二级分类名称'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    if (!mainClassUUID.value) {
        showError.value = true
        errorMessage.value = '请先添加一级分类'
        setTimeout(() => {
            showError.value = false
        }, 3000)
        return
    }
    const escapedSubGroupName = subGroupName.value.replace(/'/g, "''")
    if (subGroupUUID.value.length <= 0) {
        subGroupUUID.value = uuidv7();
    }
    subGroupSql.value = `INSERT OR REPLACE INTO "tag_subgroups" ("name", "color", "create_time", "p_uuid", "g_uuid") VALUES ('${escapedSubGroupName}', 'rgba(255, 123, 2, .4)', 0, '${mainClassUUID.value}', '${subGroupUUID.value}');`
    showError.value = false
}


watch(groupSql, (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return;
    // 提取 p_uuid（最后一个单引号包裹的内容）
    const newPUuid = newVal.match(/'([^']+)'\s*\)\s*;?$/)?.[1];
    const oldPUuid = oldVal?.match(/'([^']+)'\s*\)\s*;?$/)?.[1];

    if (newPUuid && oldPUuid && subGroupSql.value) {
        // 只替换原有 oldPUuid 为 newPUuid
        subGroupSql.value = subGroupSql.value.replace(
            new RegExp(`'${oldPUuid}'`, 'g'),
            `'${newPUuid}'`
        );
    }
});


watch(subGroupSql, (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return;
    // 提取 g_uuid（最后一个单引号包裹的内容）
    const newGUuid = newVal.match(/'([^']+)'\s*\)\s*;?$/)?.[1];
    const oldGUuid = oldVal?.match(/'([^']+)'\s*\)\s*;?$/)?.[1];
    if (newGUuid && oldGUuid && tagGroups.value.length > 0) {
        // 只替换原有 oldGUuid 为 newGUuid
        tagGroups.value = tagGroups.value.map(sql =>
            sql.replace(new RegExp(`'${oldGUuid}'`, 'g'), `'${newGUuid}'`)
        );
    }
});



</script>

<style scoped>
:root {
    --primary-color: #3f51b5;
    --primary-light: #757de8;
    --primary-dark: #002984;
    --secondary-color: #ff9800;
    --secondary-light: #ffc947;
    --secondary-dark: #c66900;
    --text-on-primary: #ffffff;
    --text-on-secondary: #000000;
    --background-color: #f5f7fa;
    --card-color: #ffffff;
    --error-color: #f44336;
    --success-color: #4caf50;
    --danger-color: #f44336;
    --warning-color: #ff9800;
    --info-color: #2196f3;
    --border-radius: 8px;
    --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* 全局样式 */
body {
    background-color: var(--background-color);
    color: #333;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 15px;
}

div {
    margin-bottom: 20px;
}

/* 错误消息样式 */
.error-message {
    position: fixed;
    left: 0;
    top: 30px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.error-msg-box{
    padding: 12px 16px;
    background-color: #ffebee;
    color: #c62828;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
    box-shadow: var(--box-shadow);
    animation: fadeIn 0.3s ease;
    border-left: 4px solid var(--error-color);
    display: flex;
    align-items: center;
}

.error-icon {
    font-style: normal;
    background-color: var(--error-color);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-weight: bold;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 头部区域 */
.header-section {
    margin-bottom: 15px;
}

.app-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-dark);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}

.version-badge {
    font-size: 14px;
    background-color: var(--primary-light);
    color: rgb(172, 170, 170);
    padding: 2px 8px;
    border-radius: 12px;
    margin-left: 10px;
}

/* 信息链接区域 */
.info-links {
    background-color: var(--card-color);
    padding: 10px;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    margin-bottom: 15px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    border-left: 4px solid var(--primary-color);
}

.info-link-item {
    display: flex;
    align-items: center;
    margin: 0 16px 0 0;
}

.info-link-label {
    font-weight: 600;
    margin-right: 8px;
    color: var(--primary-dark);
}

.info-link {
    color: var(--primary-color);
    text-decoration: none;
    transition: var(--transition);
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
}

.info-link:hover {
    background-color: rgba(63, 81, 181, 0.1);
    text-decoration: underline;
}

.link-icon {
    margin-right: 6px;
    font-style: normal;
}

/* 操作面板 */
.action-panel {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.panel-section {
    background-color: var(--card-color);
    border-radius: var(--border-radius);
    padding: 15px;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
}

.panel-section:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-dark);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--primary-light);
}

.button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.button-group.compact {
    margin-bottom: 0;
}

.flex-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
}

.input-group {
    margin-bottom: 12px;
}

.input-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--primary-dark);
}

.full-width {
    width: 97%;
}

.uuid-input {
    font-family: monospace;
    font-size: 0.9em;
    background-color: #f8f9fa;
}

/* 按钮样式 */
button {
    padding: 8px 14px;
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95em;
}

button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

button:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
}

.btn-icon {
    margin-right: 6px;
    font-style: normal;
}

.primary-btn {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
}

.upload-btn {
    background-color: var(--secondary-color);
    color: var(--text-on-secondary);
}

.upload-btn:hover {
    background-color: var(--secondary-dark);
}

.danger-btn {
    background-color: var(--danger-color);
}

.danger-btn:hover {
    color: #fff;
    background-color: #d32f2f;
}

.success-btn {
    background-color: var(--success-color);
}

.success-btn:hover {
    color: white;
    background-color: #388e3c;
}

.edit-btn {
    background-color: var(--info-color);
}

.delete-btn {
    background-color: var(--danger-color);
}

.cancel-btn {
    background-color: #9e9e9e;
}

/* 输入框样式 */
input {
    padding: 8px 10px;
    border: 1px solid #ddd;
    border-radius: var(--border-radius);
    margin-right: 6px;
    transition: var(--transition);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 0.95em;
}

input:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2);
}

input::placeholder {
    color: #aaa;
}

/* 数据容器样式 */
.data-container {
    margin-top: 15px;
    padding: 15px;
    background-color: var(--card-color);
    border-radius: var(--border-radius);
    min-height: 400px;
    overflow: hidden;
    box-shadow: var(--box-shadow);
    border: 1px solid #eaeaea;
}

.data-content {
    height: 100%;
}

.subcategory-section {
    margin-top: 20px;
}

.tag-group-container {
    height: 350px;
    overflow-y: auto;
    padding-right: 10px;
}

.tag-group-container::-webkit-scrollbar {
    width: 8px;
}

.tag-group-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.tag-group-container::-webkit-scrollbar-thumb {
    background: #c5cae9;
    border-radius: 10px;
}

.tag-group-container::-webkit-scrollbar-thumb:hover {
    background: #9fa8da;
}

/* 标题样式 */
h3 {
    margin: 5px 0 10px 0;
    color: var(--primary-dark);
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--primary-light);
    display: flex;
    align-items: center;
    font-size: 1.1em;
}

h4 {
    margin: 10px 0 8px 0;
    color: var(--primary-color);
    font-weight: 500;
    display: flex;
    align-items: center;
    font-size: 1em;
}

.category-icon,
.subcategory-icon {
    margin-right: 8px;
    font-style: normal;
}

/* 标签项样式 */
.tag-item {
    background-color: #f9f9f9;
    padding: 12px;
    border-radius: var(--border-radius);
    margin-bottom: 8px;
    transition: var(--transition);
    border-left: 3px solid var(--secondary-color);
    position: relative;
}

.tag-item:hover {
    background-color: #f0f0f0;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.tag-text {
    margin: 0 0 12px 0;
    font-weight: 500;
    display: flex;
    align-items: center;
}

.tag-icon {
    margin-right: 8px;
    font-style: normal;
}

.tag-controls {
    display: flex;
    gap: 10px;
}

.edit-controls {
    background-color: #f0f0f0;
    padding: 12px;
    border-radius: var(--border-radius);
    margin-top: 10px;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #9e9e9e;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 18px;
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {

    input,
    button {
        width: 100%;
        margin-bottom: 10px;
        margin-right: 0;
    }

    button {
        margin-left: 0 !important;
    }

    .info-links {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>