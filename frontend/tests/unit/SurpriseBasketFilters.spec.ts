import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SurpriseBasketFilters, { type SurpriseBasketFilterModel } from '@/components/product/SurpriseBasketFilters.vue'

describe('SurpriseBasketFilters', () => {
  it('émet les mises à jour du modèle lorsque les filtres changent', async () => {
    const initialModel: SurpriseBasketFilterModel = { categoryId: null, minPrice: null, maxPrice: null }
    const wrapper = mount(SurpriseBasketFilters, {
      props: {
        modelValue: initialModel,
        categories: [{ id: 1, name: 'Boulangerie' }],
        priceSteps: [500, 1000]
      }
    })

    const selects = wrapper.findAll('select')
    await selects[0].setValue('1')
    const firstUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SurpriseBasketFilterModel
    expect(firstUpdate.categoryId).toBe(1)
    await wrapper.setProps({ modelValue: firstUpdate })

    await selects[1].setValue('500')
    const secondUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SurpriseBasketFilterModel
    expect(secondUpdate.minPrice).toBe(500)
    await wrapper.setProps({ modelValue: secondUpdate })

    await selects[2].setValue('1000')
    const thirdUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SurpriseBasketFilterModel
    expect(thirdUpdate.maxPrice).toBe(1000)
    await wrapper.setProps({ modelValue: thirdUpdate })

    await wrapper.get('button[type="button"]').trigger('click')
    const resetEvent = wrapper.emitted('reset')
    expect(resetEvent).toBeTruthy()
    const resetModel = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SurpriseBasketFilterModel
    expect(resetModel).toEqual({ categoryId: null, minPrice: null, maxPrice: null })
  })
})
