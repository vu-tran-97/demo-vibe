import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should wrap data in { success: true, data }', (done) => {
    const mockHandler: CallHandler = { handle: () => of({ id: 1, name: 'test' }) };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { id: 1, name: 'test' } });
      done();
    });
  });

  it('should wrap null data as { success: true, data: null }', (done) => {
    const mockHandler: CallHandler = { handle: () => of(null) };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('should wrap undefined data as { success: true, data: null }', (done) => {
    const mockHandler: CallHandler = { handle: () => of(undefined) };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('should wrap array data', (done) => {
    const mockHandler: CallHandler = { handle: () => of([1, 2, 3]) };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      done();
    });
  });
});
