package com.caraxes.app.ui

import android.view.LayoutInflater
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.fragment.app.Fragment
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.OrderOut
import com.caraxes.app.data.OrderUpdate
import com.caraxes.app.data.Session
import com.caraxes.app.databinding.DialogEditOrderBinding
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

fun Fragment.showEditOrderDialog(order: OrderOut, onSaved: () -> Unit) {
    val content = DialogEditOrderBinding.inflate(LayoutInflater.from(requireContext()))
    val managerLocked = !Session.isAdmin(requireContext())
    val shopId = if (managerLocked) Session.shopId(requireContext()).takeIf { it > 0 } ?: order.shop_id else order.shop_id
    var selectedShopId: Int? = shopId
    var selectedSupplierId: Int? = order.supplier_id
    content.editOrderMeta.text = "编号：${order.order_no.ifBlank { order.id.toString() }}"
    content.editOrderDate.setText(order.order_date)
    content.editDailyTotal.setText(if (order.daily_total > 0) order.daily_total.toString() else "")
    content.editShopChips.bindChoices(
        shopsToChoices(Catalog.shops, allowEmpty = false),
        selectedShopId,
        locked = managerLocked,
    ) { selectedShopId = it }
    content.editSupplierChips.bindChoices(
        suppliersToChoices(Catalog.suppliers, allowEmpty = false),
        selectedSupplierId,
        locked = false,
    ) { selectedSupplierId = it }
    content.editOrderDate.setOnClickListener {
        pickDate(content.editOrderDate.text?.toString().orEmpty().ifBlank { todayIso() }) {
            content.editOrderDate.setText(it)
        }
    }

    val dialog = MaterialAlertDialogBuilder(requireContext())
        .setTitle("修改订单")
        .setView(content.root)
        .setPositiveButton("保存", null)
        .setNegativeButton("取消", null)
        .create()
    dialog.setOnShowListener {
        val saveBtn = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
        saveBtn.setOnClickListener {
            val date = content.editOrderDate.text?.toString().orEmpty()
            val shop = if (managerLocked) Session.shopId(requireContext()) else selectedShopId ?: 0
            val supplier = selectedSupplierId ?: 0
            val amount = content.editDailyTotal.text?.toString()?.toDoubleOrNull() ?: 0.0
            when {
                date.isBlank() -> {
                    content.editDailyTotal.error = "请选择日期"
                    return@setOnClickListener
                }
                shop <= 0 || supplier <= 0 -> {
                    content.editDailyTotal.error = "请选择店铺和供应商"
                    return@setOnClickListener
                }
                amount <= 0 -> {
                    content.editDailyTotal.error = "单日总金额必须大于 0"
                    return@setOnClickListener
                }
            }
            saveBtn.isEnabled = false
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).updateOrder(
                        order.id,
                        OrderUpdate(
                            order_date = date,
                            shop_id = shop,
                            supplier_id = supplier,
                            daily_total = amount,
                        ),
                    )
                    dialog.dismiss()
                    onSaved()
                } catch (e: Exception) {
                    content.editDailyTotal.error = fail(e)
                    saveBtn.isEnabled = true
                }
            }
        }
    }
    dialog.show()
}
