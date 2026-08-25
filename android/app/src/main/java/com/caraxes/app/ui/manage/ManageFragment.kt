package com.caraxes.app.ui.manage

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.DeletionOut
import com.caraxes.app.data.ManagerOut
import com.caraxes.app.data.NameCreate
import com.caraxes.app.data.ShopOut
import com.caraxes.app.data.SupplierOut
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.FragmentManageBinding
import com.caraxes.app.databinding.ItemDeletionBinding
import com.caraxes.app.databinding.ItemManageCardBinding
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.promptRename
import com.caraxes.app.ui.showMsg
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.launch

class ManageFragment : Fragment() {
    private var _binding: FragmentManageBinding? = null
    private val binding get() = _binding!!
    private var managers: List<ManagerOut> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentManageBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.addShopBtn.setOnClickListener { addShop() }
        binding.addSupplierBtn.setOnClickListener { addSupplier() }
        binding.clearDeletionsBtn.setOnClickListener { clearDeletions() }
        loadAll()
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) loadAll()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun loadAll() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val api = ApiClient.get(requireContext())
                Catalog.refresh(api)
                managers = runCatching { api.listManagers() }.getOrDefault(emptyList())
                renderShops()
                renderSuppliers()
                loadDeletions()
            } catch (e: Exception) {
                showMsg(binding.shopMsg, fail(e), false)
            }
        }
    }

    private fun ghostButton(text: String, danger: Boolean = false): MaterialButton {
        val btn = MaterialButton(requireContext(), null, com.google.android.material.R.attr.materialButtonOutlinedStyle)
        btn.text = text
        btn.textSize = 13f
        btn.cornerRadius = (10 * resources.displayMetrics.density).toInt()
        btn.insetTop = 0
        btn.insetBottom = 0
        btn.minHeight = (36 * resources.displayMetrics.density).toInt()
        btn.minimumHeight = btn.minHeight
        val lp = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
        )
        lp.marginEnd = (8 * resources.displayMetrics.density).toInt()
        btn.layoutParams = lp
        if (danger) {
            val color = requireContext().getColor(R.color.cinnabar)
            btn.setTextColor(color)
            btn.strokeColor = android.content.res.ColorStateList.valueOf(color)
        } else {
            btn.setTextColor(requireContext().getColor(R.color.pine))
        }
        return btn
    }

    private fun renderShops() {
        binding.shopList.removeAllViews()
        if (Catalog.shops.isEmpty()) {
            binding.shopList.addView(emptyHint("暂无店铺"))
            return
        }
        Catalog.shops.forEach { shop ->
            val card = ItemManageCardBinding.inflate(layoutInflater, binding.shopList, false)
            bindShopCard(card, shop)
            binding.shopList.addView(card.root)
        }
    }

    private fun bindShopCard(card: ItemManageCardBinding, shop: ShopOut) {
        val shopManagers = managers.filter { it.shop_id == shop.id }
        card.name.text = shop.name
        card.managerName.text = when {
            shopManagers.isEmpty() -> "暂无店长"
            else -> "店长：${shopManagers.joinToString("、") { it.username }}"
        }
        card.managerName.setTextColor(
            requireContext().getColor(
                if (shopManagers.isEmpty() || shopManagers.all { it.disabled }) R.color.ink_soft else R.color.ink,
            ),
        )
        card.monthTotal.text = "本月 ¥${formatMoney(shop.month_total)}"
        card.actions.removeAllViews()
        shopManagers.forEach { mgr ->
            val toggle = ghostButton(if (mgr.disabled) "启用" else "禁用", danger = !mgr.disabled)
            toggle.setOnClickListener { toggleManager(mgr) }
            card.actions.addView(toggle)
        }
        val rename = ghostButton("改名")
        rename.setOnClickListener {
            promptRename("修改店铺名称", shop.name) { name -> renameShop(shop, name) }
        }
        card.actions.addView(rename)
        val refresh = ghostButton("刷新")
        refresh.setOnClickListener { refreshShop(shop, card) }
        card.actions.addView(refresh)
        val delete = ghostButton("删除", danger = true)
        delete.setOnClickListener { deleteShop(shop) }
        card.actions.addView(delete)
    }

    private fun renderSuppliers() {
        binding.supplierList.removeAllViews()
        if (Catalog.suppliers.isEmpty()) {
            binding.supplierList.addView(emptyHint("暂无供应商"))
            return
        }
        Catalog.suppliers.forEach { item ->
            val card = ItemManageCardBinding.inflate(layoutInflater, binding.supplierList, false)
            bindSupplierCard(card, item)
            binding.supplierList.addView(card.root)
        }
    }

    private fun bindSupplierCard(card: ItemManageCardBinding, item: SupplierOut) {
        card.name.text = item.name
        card.managerName.isVisible = false
        card.monthTotal.text = "本月 ¥${formatMoney(item.month_total)}"
        card.actions.removeAllViews()
        val rename = ghostButton("改名")
        rename.setOnClickListener {
            promptRename("修改供应商名称", item.name) { name -> renameSupplier(item, name) }
        }
        card.actions.addView(rename)
        val refresh = ghostButton("刷新")
        refresh.setOnClickListener { refreshSupplier(item, card) }
        card.actions.addView(refresh)
        val delete = ghostButton("删除", danger = true)
        delete.setOnClickListener { deleteSupplier(item) }
        card.actions.addView(delete)
    }

    private fun emptyHint(text: String): TextView {
        return TextView(requireContext()).apply {
            this.text = text
            setTextColor(requireContext().getColor(R.color.ink_soft))
            textSize = 13f
            setPadding(8, 12, 8, 12)
        }
    }

    private fun addShop() {
        clearMsg(binding.shopMsg)
        val name = binding.newShopName.text?.toString()?.trim()?.replace(Regex("\\s+"), " ").orEmpty()
        if (name.isBlank()) {
            showMsg(binding.shopMsg, "请输入店铺名", false)
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                ApiClient.get(requireContext()).createShop(NameCreate(name))
                binding.newShopName.setText("")
                showMsg(binding.shopMsg, "店铺已添加，店长账号已自动创建（用户名=店名，密码 12345）", true)
                loadAll()
            } catch (e: Exception) {
                showMsg(binding.shopMsg, fail(e), false)
            }
        }
    }

    private fun addSupplier() {
        clearMsg(binding.supplierMsg)
        val name = binding.newSupplierName.text?.toString()?.trim()?.replace(Regex("\\s+"), " ").orEmpty()
        if (name.isBlank()) {
            showMsg(binding.supplierMsg, "请输入供应商名", false)
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                ApiClient.get(requireContext()).createSupplier(NameCreate(name))
                binding.newSupplierName.setText("")
                showMsg(binding.supplierMsg, "供应商已添加", true)
                loadAll()
            } catch (e: Exception) {
                showMsg(binding.supplierMsg, fail(e), false)
            }
        }
    }

    private fun renameShop(shop: ShopOut, name: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                ApiClient.get(requireContext()).updateShop(shop.id, NameCreate(name))
                showMsg(binding.shopMsg, "店铺已改名", true)
                loadAll()
            } catch (e: Exception) {
                showMsg(binding.shopMsg, fail(e), false)
            }
        }
    }

    private fun renameSupplier(item: SupplierOut, name: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                ApiClient.get(requireContext()).updateSupplier(item.id, NameCreate(name))
                showMsg(binding.supplierMsg, "供应商已改名", true)
                loadAll()
            } catch (e: Exception) {
                showMsg(binding.supplierMsg, fail(e), false)
            }
        }
    }

    private fun refreshShop(shop: ShopOut, card: ItemManageCardBinding) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val latest = ApiClient.get(requireContext()).getShop(shop.id)
                Catalog.shops = Catalog.shops.map { if (it.id == latest.id) latest else it }
                card.monthTotal.text = "本月 ¥${formatMoney(latest.month_total)}"
                showMsg(binding.shopMsg, "本月金额已刷新", true)
            } catch (e: Exception) {
                showMsg(binding.shopMsg, fail(e), false)
            }
        }
    }

    private fun refreshSupplier(item: SupplierOut, card: ItemManageCardBinding) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val latest = ApiClient.get(requireContext()).getSupplier(item.id)
                Catalog.suppliers = Catalog.suppliers.map { if (it.id == latest.id) latest else it }
                card.monthTotal.text = "本月 ¥${formatMoney(latest.month_total)}"
                showMsg(binding.supplierMsg, "本月金额已刷新", true)
            } catch (e: Exception) {
                showMsg(binding.supplierMsg, fail(e), false)
            }
        }
    }

    private fun toggleManager(mgr: ManagerOut) {
        val willDisable = !mgr.disabled
        val action = if (willDisable) "禁用" else "启用"
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("${action}店长")
            .setMessage("确认${action}店长「${mgr.username}」？")
            .setPositiveButton("确定$action") { _, _ ->
                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        ApiClient.get(requireContext()).setManagerDisabled(
                            mgr.id,
                            com.caraxes.app.data.ManagerDisabledIn(willDisable),
                        )
                        showMsg(binding.shopMsg, "店长已$action", true)
                        loadAll()
                    } catch (e: Exception) {
                        showMsg(binding.shopMsg, fail(e), false)
                    }
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun deleteShop(shop: ShopOut) {
        promptPassword("确认删除", "确认删除店铺「${shop.name}」？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteShop(shop.id, password)
                    showMsg(binding.shopMsg, "店铺已删除", true)
                    loadAll()
                } catch (e: Exception) {
                    showMsg(binding.shopMsg, fail(e), false)
                }
            }
        }
    }

    private fun deleteSupplier(item: SupplierOut) {
        promptPassword("确认删除", "确认删除供应商「${item.name}」？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteSupplier(item.id, password)
                    showMsg(binding.supplierMsg, "供应商已删除", true)
                    loadAll()
                } catch (e: Exception) {
                    showMsg(binding.supplierMsg, fail(e), false)
                }
            }
        }
    }

    private fun loadDeletions() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val list = ApiClient.get(requireContext()).listDeletions()
                renderDeletions(list)
            } catch (e: Exception) {
                renderDeletions(emptyList())
                binding.deletionEmpty.text = fail(e)
                binding.deletionEmpty.isVisible = true
            }
        }
    }

    private fun renderDeletions(list: List<DeletionOut>) {
        binding.deletionList.removeAllViews()
        binding.deletionEmpty.isVisible = list.isEmpty()
        binding.clearDeletionsBtn.isVisible = list.isNotEmpty()
        binding.deletionMeta.text = if (list.isEmpty()) "" else "最近 ${list.size} 条"
        list.forEach { item ->
            val row = ItemDeletionBinding.inflate(layoutInflater, binding.deletionList, false)
            val whenText = item.deleted_at.replace('T', ' ').take(19)
            val who = item.operator_username.ifBlank { "未知" }
            row.timeText.text = "$whenText  ·  ${item.kind_label}  ·  $who（${item.operator_role_label}）"
            row.summary.text = item.summary
            binding.deletionList.addView(row.root)
        }
    }

    private fun clearDeletions() {
        promptPassword("清空删除记录", "确认清空全部删除记录？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).clearDeletions(password)
                    loadDeletions()
                } catch (e: Exception) {
                    showMsg(binding.shopMsg, fail(e), false)
                }
            }
        }
    }
}
