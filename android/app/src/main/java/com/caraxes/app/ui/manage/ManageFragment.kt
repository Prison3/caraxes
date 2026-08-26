package com.caraxes.app.ui.manage

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.NameCreate
import com.caraxes.app.data.ShopOut
import com.caraxes.app.data.SupplierOut
import com.caraxes.app.databinding.FragmentManageBinding
import com.caraxes.app.databinding.ItemManageCardBinding
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.promptRename
import com.caraxes.app.ui.showMsg
import kotlinx.coroutines.launch

class ManageFragment : Fragment() {
    private var _binding: FragmentManageBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentManageBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.addShopBtn.setOnClickListener { addShop() }
        binding.addSupplierBtn.setOnClickListener { addSupplier() }
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
                Catalog.refresh(ApiClient.get(requireContext()))
                renderShops()
                renderSuppliers()
            } catch (e: Exception) {
                showMsg(binding.shopMsg, fail(e), false)
            }
        }
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
        card.name.text = shop.name
        card.renameBtn.setOnClickListener {
            promptRename("修改店铺名称", shop.name) { name -> renameShop(shop, name) }
        }
        card.deleteBtn.setOnClickListener { deleteShop(shop) }
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
        card.renameBtn.setOnClickListener {
            promptRename("修改供应商名称", item.name) { name -> renameSupplier(item, name) }
        }
        card.deleteBtn.setOnClickListener { deleteSupplier(item) }
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
}
