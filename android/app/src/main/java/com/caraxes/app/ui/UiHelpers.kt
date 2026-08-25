package com.caraxes.app.ui

import android.app.DatePickerDialog
import android.view.LayoutInflater
import android.widget.NumberPicker
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.caraxes.app.R
import com.caraxes.app.data.Session
import com.caraxes.app.data.ShopOut
import com.caraxes.app.data.SupplierOut
import com.caraxes.app.data.apiErrorMessage
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import retrofit2.HttpException
import java.util.Calendar

data class Choice(
    val id: Int?,
    val name: String,
)

fun shopsToChoices(
    shops: List<ShopOut>,
    allowEmpty: Boolean,
    emptyLabel: String = "全部店铺",
): List<Choice> {
    val items = shops.map { Choice(it.id, it.name) }
    return if (allowEmpty) listOf(Choice(null, emptyLabel)) + items else items
}

fun suppliersToChoices(
    suppliers: List<SupplierOut>,
    allowEmpty: Boolean,
    emptyLabel: String = "全部供应商",
): List<Choice> {
    val items = suppliers.map { Choice(it.id, it.name) }
    return if (allowEmpty) listOf(Choice(null, emptyLabel)) + items else items
}

fun ChipGroup.bindChoices(
    items: List<Choice>,
    selectedId: Int?,
    locked: Boolean = false,
    onSelect: (Int?) -> Unit,
) {
    setOnCheckedStateChangeListener(null)
    removeAllViews()
    if (items.isEmpty()) {
        val empty = TextView(context)
        empty.text = "暂无选项"
        empty.setTextColor(ContextCompat.getColor(context, R.color.ink_soft))
        empty.textSize = 13f
        addView(empty)
        return
    }
    items.forEach { choice ->
        val chip = Chip(context, null, com.google.android.material.R.attr.chipStyle)
        chip.text = choice.name
        chip.isCheckable = true
        chip.tag = choice
        chip.isChecked = choice.id == selectedId || (choice.id == null && selectedId == null)
        chip.isEnabled = !locked || chip.isChecked
        addView(chip)
    }
    setOnCheckedStateChangeListener { group, checkedIds ->
        if (locked) return@setOnCheckedStateChangeListener
        val chipId = checkedIds.firstOrNull() ?: return@setOnCheckedStateChangeListener
        val chip = group.findViewById<Chip>(chipId) ?: return@setOnCheckedStateChangeListener
        val choice = chip.tag as? Choice ?: return@setOnCheckedStateChangeListener
        onSelect(choice.id)
    }
}

fun ChipGroup.selectedChoiceId(): Int? {
    for (i in 0 until childCount) {
        val chip = getChildAt(i) as? Chip ?: continue
        if (chip.isChecked) {
            return (chip.tag as? Choice)?.id
        }
    }
    return null
}

fun Fragment.todayIso(): String {
    val cal = Calendar.getInstance()
    return "%04d-%02d-%02d".format(
        cal.get(Calendar.YEAR),
        cal.get(Calendar.MONTH) + 1,
        cal.get(Calendar.DAY_OF_MONTH),
    )
}

fun Fragment.currentMonth(): String {
    val cal = Calendar.getInstance()
    return "%04d-%02d".format(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
}

fun Fragment.pickDate(current: String, onPicked: (String) -> Unit) {
    val parts = current.split("-")
    val cal = Calendar.getInstance()
    if (parts.size >= 3) {
        runCatching {
            cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
        }
    }
    DatePickerDialog(
        requireContext(),
        { _, year, month, day ->
            onPicked("%04d-%02d-%02d".format(year, month + 1, day))
        },
        cal.get(Calendar.YEAR),
        cal.get(Calendar.MONTH),
        cal.get(Calendar.DAY_OF_MONTH),
    ).show()
}

fun Fragment.pickMonth(current: String, onPicked: (String) -> Unit) {
    val parts = current.split("-")
    val yearNow = Calendar.getInstance().get(Calendar.YEAR)
    val monthNow = Calendar.getInstance().get(Calendar.MONTH) + 1
    val year = parts.getOrNull(0)?.toIntOrNull() ?: yearNow
    val month = parts.getOrNull(1)?.toIntOrNull() ?: monthNow
    val box = android.widget.LinearLayout(requireContext()).apply {
        orientation = android.widget.LinearLayout.HORIZONTAL
        setPadding(48, 24, 48, 8)
    }
    val yearPicker = NumberPicker(requireContext()).apply {
        minValue = yearNow - 8
        maxValue = yearNow + 1
        value = year.coerceIn(minValue, maxValue)
        layoutParams = android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    }
    val monthPicker = NumberPicker(requireContext()).apply {
        minValue = 1
        maxValue = 12
        value = month.coerceIn(1, 12)
        layoutParams = android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    }
    box.addView(yearPicker)
    box.addView(monthPicker)
    MaterialAlertDialogBuilder(requireContext())
        .setTitle("选择月份")
        .setView(box)
        .setPositiveButton("确定") { _, _ ->
            onPicked("%04d-%02d".format(yearPicker.value, monthPicker.value))
        }
        .setNegativeButton("取消", null)
        .show()
}

fun Fragment.showMsg(view: TextView, text: String, ok: Boolean) {
    view.text = text
    view.setTextColor(
        ContextCompat.getColor(requireContext(), if (ok) R.color.pine else R.color.cinnabar),
    )
}

fun Fragment.clearMsg(view: TextView) {
    view.text = ""
}

fun Fragment.promptPassword(title: String, message: String, onConfirm: (String) -> Unit) {
    val content = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_confirm, null, false)
    val input = content.findViewById<TextInputEditText>(R.id.confirmPassword)
    val dialog = MaterialAlertDialogBuilder(requireContext())
        .setTitle(title)
        .setMessage(message)
        .setView(content)
        .setPositiveButton("确定", null)
        .setNegativeButton("取消", null)
        .create()
    dialog.setOnShowListener {
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
            val pwd = input.text?.toString().orEmpty()
            if (pwd.isBlank()) {
                input.error = "请输入登录密码"
                return@setOnClickListener
            }
            dialog.dismiss()
            onConfirm(pwd)
        }
    }
    dialog.show()
}

fun Fragment.promptRename(title: String, current: String, onConfirm: (String) -> Unit) {
    val content = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_rename, null, false)
    val input = content.findViewById<TextInputEditText>(R.id.renameValue)
    input.setText(current)
    val dialog = MaterialAlertDialogBuilder(requireContext())
        .setTitle(title)
        .setView(content)
        .setPositiveButton("保存", null)
        .setNegativeButton("取消", null)
        .create()
    dialog.setOnShowListener {
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
            val name = input.text?.toString()?.trim()?.replace(Regex("\\s+"), " ").orEmpty()
            if (name.isBlank()) {
                input.error = "请输入名称"
                return@setOnClickListener
            }
            dialog.dismiss()
            onConfirm(name)
        }
    }
    dialog.show()
}

fun Fragment.goLoginIfUnauthorized(e: Exception): Boolean {
    if (e is HttpException && e.code() == 401) {
        Session.clear(requireContext())
        val options = NavOptions.Builder()
            .setPopUpTo(findNavController().graph.id, true)
            .setLaunchSingleTop(true)
            .build()
        findNavController().navigate(R.id.loginFragment, null, options)
        return true
    }
    return false
}

fun Fragment.fail(e: Exception): String {
    if (goLoginIfUnauthorized(e)) return apiErrorMessage(e)
    return apiErrorMessage(e)
}
