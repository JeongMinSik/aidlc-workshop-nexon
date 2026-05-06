import { useState, useEffect } from 'react'
import {
  UtensilsCrossed, Plus, Pencil, Trash2, X, RotateCcw, GripVertical,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '../utils/api'

interface Category {
  id: number
  name: string
  display_order: number
}

interface Menu {
  id: number
  name: string
  price: number
  description: string
  category: string
  category_id: number
  image_url: string
  display_order: number
}

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMenu, setEditMenu] = useState<Menu | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Menu | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

  // Form state
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<number>(0)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formOrder, setFormOrder] = useState('0')
  const [formError, setFormError] = useState('')

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        adminApi.getMenus(),
        adminApi.getCategories(),
      ])
      setMenus(menuRes.menus || menuRes || [])
      setCategories(catRes.categories || catRes || [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateForm = () => {
    setEditMenu(null)
    setFormName('')
    setFormPrice('')
    setFormDescription('')
    setFormCategory(categories[0]?.id || 0)
    setFormImageUrl('')
    setFormOrder('0')
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (menu: Menu) => {
    setEditMenu(menu)
    setFormName(menu.name)
    setFormPrice(menu.price.toString())
    setFormDescription(menu.description || '')
    setFormCategory(menu.category_id)
    setFormImageUrl(menu.image_url || '')
    setFormOrder(menu.display_order?.toString() || '0')
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const price = parseInt(formPrice)
    if (!formName.trim()) { setFormError('메뉴명을 입력하세요'); return }
    if (isNaN(price) || price < 0) { setFormError('올바른 가격을 입력하세요'); return }
    if (!formCategory) { setFormError('카테고리를 선택하세요'); return }

    const data = {
      name: formName.trim(),
      price,
      description: formDescription.trim(),
      category_id: formCategory,
      image_url: formImageUrl.trim(),
      display_order: parseInt(formOrder) || 0,
    }

    try {
      if (editMenu) {
        await adminApi.updateMenu(editMenu.id, data)
      } else {
        await adminApi.createMenu(data)
      }
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      setFormError(err.message || '저장 실패')
    }
  }

  const handleDelete = async (menu: Menu) => {
    try {
      await adminApi.deleteMenu(menu.id)
      setDeleteConfirm(null)
      fetchData()
    } catch (e: any) {
      alert('삭제 실패: ' + e.message)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      await adminApi.createCategory({ name: newCategoryName.trim(), display_order: categories.length })
      setShowCategoryForm(false)
      setNewCategoryName('')
      fetchData()
    } catch (e: any) {
      alert('카테고리 생성 실패: ' + e.message)
    }
  }

  const filteredMenus = selectedCategory === 'all'
    ? menus
    : menus.filter((m) => m.category_id === selectedCategory)

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-indigo-400" />
            메뉴 관리
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">메뉴 등록, 수정, 삭제 및 카테고리 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all text-sm"
          >
            <Plus size={14} /> 카테고리
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium rounded-xl transition-all border border-indigo-500/30 text-sm"
          >
            <Plus size={14} /> 메뉴 추가
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white bg-surface-800'
            }`}
          >
            전체 ({menus.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white bg-surface-800'
              }`}
            >
              {cat.name} ({menus.filter((m) => m.category_id === cat.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Menu List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <RotateCcw size={20} className="animate-spin mr-2" /> 로딩 중...
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <UtensilsCrossed size={48} className="mb-3 opacity-30" />
          <p className="text-sm">등록된 메뉴가 없습니다</p>
          <button onClick={openCreateForm} className="mt-3 text-indigo-400 text-sm hover:underline">
            + 첫 메뉴 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMenus.map((menu) => (
            <div key={menu.id} className="glass-light rounded-xl p-4 flex items-center gap-4 group hover:border-indigo-500/20 transition-all">
              {/* Image */}
              {menu.image_url ? (
                <img
                  src={menu.image_url}
                  alt={menu.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed size={20} className="text-slate-600" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{menu.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">{menu.category}</span>
                </div>
                {menu.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{menu.description}</p>
                )}
                <p className="text-sm font-bold text-indigo-300 mt-1">₩{menu.price.toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditForm(menu)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Pencil size={14} className="text-slate-400" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(menu)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editMenu ? '메뉴 수정' : '메뉴 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">메뉴명 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="메뉴 이름"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">가격 (원) *</label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="10000"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">설명</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="메뉴 설명"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">카테고리 *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value={0} disabled>선택하세요</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">이미지 URL</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">노출 순서</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              {formError && (
                <p className="text-red-400 text-xs">{formError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all"
              >
                {editMenu ? '수정' : '추가'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">메뉴 삭제</h3>
                <p className="text-xs text-slate-400">{deleteConfirm.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">이 메뉴를 삭제하시겠습니까?</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">카테고리 추가</h3>
              <button onClick={() => setShowCategoryForm(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">카테고리명</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="예: 메인메뉴, 사이드, 음료"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all"
              >
                추가
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
