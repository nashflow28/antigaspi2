<?php

namespace Laravel\Scout\Contracts;

use Laravel\Scout\Builder;

interface PaginatesEloquentModels
{
    /**
     * Paginate the given search on the engine.
     *
     * @param  int  $perPage
     * @param  int  $page
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginate(Builder $builder, $perPage, $page);

    /**
     * Paginate the given search on the engine using simple pagination.
     *
     * @param  int  $perPage
     * @param  int  $page
     * @return \Illuminate\Contracts\Pagination\Paginator
     */
    public function simplePaginate(Builder $builder, $perPage, $page);
}
