/* SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Iofe Kirill
 * ZMROBO E6 application layout for ARM GNU ld.
 * The controller loads application vectors at 0x080e0000.
 * Symbols below are the ABI required by the E6 startup object and newlib.
 */
ENTRY(Reset_Handler)
MEMORY {
    application (rx) : ORIGIN = 0x080e0000, LENGTH = 131072
    work (rw)        : ORIGIN = 0x20000000, LENGTH = 131072
    fast (rw)        : ORIGIN = 0x10000000, LENGTH = 65536
}
_estack = ORIGIN(work) + LENGTH(work);
_Min_Heap_Size = 512;
_Min_Stack_Size = 1024;
SECTIONS {
    .isr_vector : {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
        . = ALIGN(4);
    } > application
    .text : {
        . = ALIGN(4);
        *(.text)
        *(.text*)
        *(.glue_7 .glue_7t .eh_frame)
        KEEP(*(.init))
        KEEP(*(.fini))
        . = ALIGN(4);
        _etext = .;
    } > application
    .rodata : {
        . = ALIGN(4);
        *(.rodata)
        *(.rodata*)
        . = ALIGN(4);
    } > application
    .ARM.extab : { *(.ARM.extab* .gnu.linkonce.armextab.*) } > application
    .ARM : {
        __exidx_start = .;
        *(.ARM.exidx*)
        __exidx_end = .;
    } > application
    .preinit_array : {
        PROVIDE_HIDDEN(__preinit_array_start = .);
        KEEP(*(.preinit_array*))
        PROVIDE_HIDDEN(__preinit_array_end = .);
    } > application
    .init_array : {
        PROVIDE_HIDDEN(__init_array_start = .);
        KEEP(*(SORT(.init_array.*)))
        KEEP(*(.init_array*))
        PROVIDE_HIDDEN(__init_array_end = .);
    } > application
    .fini_array : {
        PROVIDE_HIDDEN(__fini_array_start = .);
        KEEP(*(SORT(.fini_array.*)))
        KEEP(*(.fini_array*))
        PROVIDE_HIDDEN(__fini_array_end = .);
    } > application
    .data : {
        . = ALIGN(4);
        _sdata = .;
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } > work AT > application
    _sidata = LOADADDR(.data);
    /* Initialized CCM data needs controller startup support; preserve its ABI. */
    .ccmram : {
        . = ALIGN(4);
        _sccmram = .;
        *(.ccmram)
        *(.ccmram*)
        . = ALIGN(4);
        _eccmram = .;
    } > fast AT > application
    _siccmram = LOADADDR(.ccmram);
    . = ALIGN(4);
    .bss : {
        _sbss = .;
        __bss_start__ = .;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
        __bss_end__ = .;
    } > work
    ._user_heap_stack : {
        . = ALIGN(8);
        PROVIDE(end = .);
        PROVIDE(_end = .);
        . += _Min_Heap_Size + _Min_Stack_Size;
        . = ALIGN(8);
    } > work
    /* E6 uses nano.specs; exclude the full-size archive variants. */
    /DISCARD/ : { libc.a(*) libm.a(*) libgcc.a(*) }
    .ARM.attributes 0 : { *(.ARM.attributes) }
}
