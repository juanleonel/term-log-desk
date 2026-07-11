(function (global) {
    const DEFAULT_ITEMS_PER_PAGE = 50;

    function paginateItems(items, currentPage, itemsPerPage) {
        const safeItems = Array.isArray(items) ? items : [];
        const safePage = Math.max(1, Number(currentPage) || 1);
        const safeItemsPerPage = Math.max(1, Number(itemsPerPage) || DEFAULT_ITEMS_PER_PAGE);
        const totalItems = safeItems.length;
        const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeItemsPerPage);
        const normalizedPage = totalPages === 0 ? 1 : Math.min(safePage, totalPages);
        const startIndex = (normalizedPage - 1) * safeItemsPerPage;
        const endIndex = startIndex + safeItemsPerPage;

        return {
            pageItems: safeItems.slice(startIndex, endIndex),
            totalItems,
            totalPages,
            currentPage: normalizedPage,
            itemsPerPage: safeItemsPerPage,
            startIndex: totalItems === 0 ? 0 : startIndex + 1,
            endIndex: totalItems === 0 ? 0 : Math.min(endIndex, totalItems)
        };
    }

    function getPageNumbers(currentPage, totalPages, maxVisiblePages = 5) {
        if (totalPages <= 1) {
            return [];
        }

        const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        const halfWindow = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(1, safeCurrentPage - halfWindow);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }

    const paginationUtils = {
        DEFAULT_ITEMS_PER_PAGE,
        paginateItems,
        getPageNumbers
    };

    global.PaginationUtils = paginationUtils;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = paginationUtils;
    }
}(typeof window !== 'undefined' ? window : globalThis));
