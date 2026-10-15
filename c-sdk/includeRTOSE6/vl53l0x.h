
#ifndef __VL53L0X_H__
#define __VL53L0X_H__

#include <jmkernel.h>
#include "I2C_Soft.h"


#define address 0x52 //地址
#define bool int
#define true 1
#define false 0
#define decodeVcselPeriod(reg_val)      (((reg_val) + 1) << 1)
#define encodeVcselPeriod(period_pclks) (((period_pclks) >> 1) - 1)
#define calcMacroPeriod(vcsel_period_pclks) ((((uint32_t)2304 * (vcsel_period_pclks) * 1655) + 500) / 1000)
#define startTimeout() (timeout_start_ms = GetSystemTime())
#define checkTimeoutExpired() (io_timeout > 0 && ((uint16_t)GetSystemTime() - timeout_start_ms) > io_timeout)

uint8_t gbuf[16];
uint8_t vl_initflag[9] ={0};
uint8_t mode_flag=0;
uint8_t MODE=0;
uint8_t stop_variable;  // read by init and used when starting measurement; is StopVariable field of VL53L0X_DevData_t structure in API
uint16_t io_timeout = 50;
uint16_t timeout_start_ms;
uint32_t measurement_timing_budget_us;

inline void setTimeout(uint16_t timeout) { io_timeout = timeout; }
bool did_timeout;

typedef enum vcselPeriodType { VcselPeriodPreRange, VcselPeriodFinalRange }vcselPeriodType;

typedef struct SequenceStepEnables
    {
      uint8_t tcc, msrc, dss, pre_range, final_range;
    }SequenceStepEnables;
	
typedef struct SequenceStepTimeouts
    {
      uint16_t pre_range_vcsel_period_pclks, final_range_vcsel_period_pclks;

      uint16_t msrc_dss_tcc_mclks, pre_range_mclks, final_range_mclks;
      uint32_t msrc_dss_tcc_us,    pre_range_us,    final_range_us;
    }SequenceStepTimeouts;	
		
enum regAddr
    {
      SYSRANGE_START                              = 0x00,

      SYSTEM_THRESH_HIGH                          = 0x0C,
      SYSTEM_THRESH_LOW                           = 0x0E,

      SYSTEM_SEQUENCE_CONFIG                      = 0x01,
      SYSTEM_RANGE_CONFIG                         = 0x09,
      SYSTEM_INTERMEASUREMENT_PERIOD              = 0x04,

      SYSTEM_INTERRUPT_CONFIG_GPIO                = 0x0A,

      GPIO_HV_MUX_ACTIVE_HIGH                     = 0x84,

      SYSTEM_INTERRUPT_CLEAR                      = 0x0B,

      RESULT_INTERRUPT_STATUS                     = 0x13,
      RESULT_RANGE_STATUS                         = 0x14,

      RESULT_CORE_AMBIENT_WINDOW_EVENTS_RTN       = 0xBC,
      RESULT_CORE_RANGING_TOTAL_EVENTS_RTN        = 0xC0,
      RESULT_CORE_AMBIENT_WINDOW_EVENTS_REF       = 0xD0,
      RESULT_CORE_RANGING_TOTAL_EVENTS_REF        = 0xD4,
      RESULT_PEAK_SIGNAL_RATE_REF                 = 0xB6,

      ALGO_PART_TO_PART_RANGE_OFFSET_MM           = 0x28,

      I2C_SLAVE_DEVICE_ADDRESS                    = 0x8A,

      MSRC_CONFIG_CONTROL                         = 0x60,

      PRE_RANGE_CONFIG_MIN_SNR                    = 0x27,
      PRE_RANGE_CONFIG_VALID_PHASE_LOW            = 0x56,
      PRE_RANGE_CONFIG_VALID_PHASE_HIGH           = 0x57,
      PRE_RANGE_MIN_COUNT_RATE_RTN_LIMIT          = 0x64,

      FINAL_RANGE_CONFIG_MIN_SNR                  = 0x67,
      FINAL_RANGE_CONFIG_VALID_PHASE_LOW          = 0x47,
      FINAL_RANGE_CONFIG_VALID_PHASE_HIGH         = 0x48,
      FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT = 0x44,

      PRE_RANGE_CONFIG_SIGMA_THRESH_HI            = 0x61,
      PRE_RANGE_CONFIG_SIGMA_THRESH_LO            = 0x62,

      PRE_RANGE_CONFIG_VCSEL_PERIOD               = 0x50,
      PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI          = 0x51,
      PRE_RANGE_CONFIG_TIMEOUT_MACROP_LO          = 0x52,

      SYSTEM_HISTOGRAM_BIN                        = 0x81,
      HISTOGRAM_CONFIG_INITIAL_PHASE_SELECT       = 0x33,
      HISTOGRAM_CONFIG_READOUT_CTRL               = 0x55,

      FINAL_RANGE_CONFIG_VCSEL_PERIOD             = 0x70,
      FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI        = 0x71,
      FINAL_RANGE_CONFIG_TIMEOUT_MACROP_LO        = 0x72,
      CROSSTALK_COMPENSATION_PEAK_RATE_MCPS       = 0x20,

      MSRC_CONFIG_TIMEOUT_MACROP                  = 0x46,

      SOFT_RESET_GO2_SOFT_RESET_N                 = 0xBF,
      IDENTIFICATION_MODEL_ID                     = 0xC0,
      IDENTIFICATION_REVISION_ID                  = 0xC2,

      OSC_CALIBRATE_VAL                           = 0xF8,

      GLOBAL_CONFIG_VCSEL_WIDTH                   = 0x32,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_0            = 0xB0,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_1            = 0xB1,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_2            = 0xB2,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_3            = 0xB3,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_4            = 0xB4,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_5            = 0xB5,

      GLOBAL_CONFIG_REF_EN_START_SELECT           = 0xB6,
      DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD         = 0x4E,
      DYNAMIC_SPAD_REF_EN_START_OFFSET            = 0x4F,
      POWER_MANAGEMENT_GO1_POWER_FORCE            = 0x80,

      VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV           = 0x89,

      ALGO_PHASECAL_LIM                           = 0x30,
      ALGO_PHASECAL_CONFIG_TIMEOUT                = 0x30,
    };


 uint16_t makeuint16(uint16_t lsb, uint16_t msb)//*****
 {
	return ((msb & 0xFF) << 8) | (lsb & 0xFF);
 }


 void vl_write_byte_data_at(Soft_I2C_Typedef *iic, uint8_t reg, uint8_t data) //*****
 {
   // 写1字节
	Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
    Soft_I2C_Write(iic,data);
    Soft_I2C_Stop(iic);
 }
 
 
 void vl_write_2bytes_data_at(Soft_I2C_Typedef *iic, uint8_t reg, uint16_t value)
{/*  写2字节
  Wire.beginTransmission(address);
  Wire.write(reg);
  Wire.write((value >> 8) & 0xFF); // value high byte
  Wire.write( value       & 0xFF); // value low byte
  last_status = Wire.endTransmission();
 */ 
    Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
    Soft_I2C_Write(iic,((value >> 8) & 0xFF));
	Soft_I2C_Write(iic,(value  & 0xFF));
	Soft_I2C_Stop(iic);
}
 
 
void vl_writeMulti_at(Soft_I2C_Typedef *iic, uint8_t reg, uint8_t const * src, uint8_t count)
{/*
  Wire.beginTransmission(address);
  Wire.write(reg);

  while (count-- > 0)
  {
    Wire.write(*(src++));
  }

  last_status = Wire.endTransmission();
  */
    Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
    while (count-- > 0)
    {
      Soft_I2C_Write(iic,*(src++));
    }
    Soft_I2C_Stop(iic);
} 


 uint8_t vl_read_byte_data_at(Soft_I2C_Typedef *iic, uint8_t reg) //*****
 {
   //write_byte_data((byte)0x00);读一个字节数据
	Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
	Soft_I2C_Delay();
	Soft_I2C_Stop(iic);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,address|0x01); 
	Soft_I2C_Delay();
    uint8_t b = Soft_I2C_Read(iic, 1);
	Soft_I2C_Stop(iic);
    return b;
 }

 bool setSignalRateLimit(Soft_I2C_Typedef *iic, float limit_Mcps) //可能需要宏定义
{
  if (limit_Mcps < 0 || limit_Mcps > 511.99) { return false; }

  // Q9.7 fixed point format (9 integer bits, 7 fractional bits)
  vl_write_2bytes_data_at(iic, FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT, limit_Mcps * (1 << 7));
  return true;
}
 
 
bool getSpadInfo(Soft_I2C_Typedef *iic, uint8_t * count, bool * type_is_aperture)
{
  uint8_t tmp;

  vl_write_byte_data_at(iic, 0x80, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x00);

  vl_write_byte_data_at(iic, 0xFF, 0x06);
  vl_write_byte_data_at(iic, 0x83, vl_read_byte_data_at(iic, 0x83) | 0x04);
  vl_write_byte_data_at(iic, 0xFF, 0x07);
  vl_write_byte_data_at(iic, 0x81, 0x01);

  vl_write_byte_data_at(iic, 0x80, 0x01);

  vl_write_byte_data_at(iic, 0x94, 0x6b);
  vl_write_byte_data_at(iic, 0x83, 0x00);
  startTimeout();
  while (vl_read_byte_data_at(iic, 0x83) == 0x00)
  {
    if (checkTimeoutExpired()) { return false; }
  }
  vl_write_byte_data_at(iic, 0x83, 0x01);
  tmp = vl_read_byte_data_at(iic, 0x92);

  *count = tmp & 0x7f;
  *type_is_aperture = (tmp >> 7) & 0x01;

  vl_write_byte_data_at(iic, 0x81, 0x00);
  vl_write_byte_data_at(iic, 0xFF, 0x06);
  vl_write_byte_data_at(iic, 0x83, vl_read_byte_data_at(iic, 0x83)  & ~0x04);
  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x01);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x80, 0x00);

  return true;
} 
 
 
 
 void vl_read_block_data_at(Soft_I2C_Typedef *iic, uint8_t reg, uint8_t len, uint8_t vbuf[]) //*****
 {	//读几个字节数据
 	uint8_t i = 0;
    Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
	//Soft_I2C_Delay();
	Soft_I2C_Stop(iic);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,address|0x01); 
	//Soft_I2C_Delay();
	while(len)
	{
		if(len==1)
		{
			vbuf[i] = Soft_I2C_Read(iic, 1);
		}
		else
		{
			vbuf[i] = Soft_I2C_Read(iic, 0);
		}
		i++;
		len--;
	}
	Soft_I2C_Stop(iic);
   
 }

 void mm_to_bytes(uint8_t *bytes, uint16_t mm)
 {
	 bytes[10] = (mm >> 8 & 0xFF);
	 bytes[11] = (mm & 0xFF);
 }
 
uint16_t decodeTimeout(uint16_t reg_val)
{
  // format: "(LSByte * 2^MSByte) + 1"
  return (uint16_t)((reg_val & 0x00FF) <<
         (uint16_t)((reg_val & 0xFF00) >> 8)) + 1;
} 
 
 
void getSequenceStepEnables(Soft_I2C_Typedef *iic, SequenceStepEnables * enables)
{
  uint8_t sequence_config = vl_read_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG);

  enables->tcc          = (sequence_config >> 4) & 0x1;
  enables->dss          = (sequence_config >> 3) & 0x1;
  enables->msrc         = (sequence_config >> 2) & 0x1;
  enables->pre_range    = (sequence_config >> 6) & 0x1;
  enables->final_range  = (sequence_config >> 7) & 0x1;
}


uint8_t getVcselPulsePeriod(Soft_I2C_Typedef *iic, vcselPeriodType type)
{
  if (type == VcselPeriodPreRange)
  {
    return decodeVcselPeriod(vl_read_byte_data_at(iic, PRE_RANGE_CONFIG_VCSEL_PERIOD));
  }
  else if (type == VcselPeriodFinalRange)
  {
    return decodeVcselPeriod(vl_read_byte_data_at(iic, FINAL_RANGE_CONFIG_VCSEL_PERIOD));
  }
  else { return 255; }
}

uint32_t  timeoutMclksToMicroseconds(uint16_t timeout_period_mclks, uint8_t vcsel_period_pclks)
{
  uint32_t macro_period_ns = calcMacroPeriod(vcsel_period_pclks);

  return ((timeout_period_mclks * macro_period_ns) + (macro_period_ns / 2)) / 1000;
} 


uint16_t vl_read_2bytes_data_at(Soft_I2C_Typedef *iic, uint8_t reg)
{  /**
  uint16_t value;

  Wire.beginTransmission(address);
  Wire.write(reg);
  last_status = Wire.endTransmission();

  Wire.requestFrom(address, (uint8_t)2);
  value  = (uint16_t)Wire.read() << 8; // value high byte
  value |=           Wire.read();      // value low byte

  return value;
  */
    uint16_t value;
    Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
	Soft_I2C_Delay();
	Soft_I2C_Stop(iic);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,address|0x01); 
	Soft_I2C_Delay();//
	value  = (uint16_t)Soft_I2C_Read(iic, 0) << 8; // value high byte
    value |=           Soft_I2C_Read(iic, 1);      // value low byte
    return value;
  
}
 
void getSequenceStepTimeouts(Soft_I2C_Typedef *iic, SequenceStepEnables const * enables, SequenceStepTimeouts * timeouts)
{
  timeouts->pre_range_vcsel_period_pclks = getVcselPulsePeriod(iic, VcselPeriodPreRange);

  timeouts->msrc_dss_tcc_mclks = vl_read_byte_data_at(iic, MSRC_CONFIG_TIMEOUT_MACROP) + 1;
  timeouts->msrc_dss_tcc_us =
    timeoutMclksToMicroseconds(timeouts->msrc_dss_tcc_mclks,
                               timeouts->pre_range_vcsel_period_pclks);

  timeouts->pre_range_mclks =
    decodeTimeout(vl_read_2bytes_data_at(iic, PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI));
  timeouts->pre_range_us =
    timeoutMclksToMicroseconds(timeouts->pre_range_mclks,
                               timeouts->pre_range_vcsel_period_pclks);

  timeouts->final_range_vcsel_period_pclks = getVcselPulsePeriod(iic, VcselPeriodFinalRange);

  timeouts->final_range_mclks =
    decodeTimeout(vl_read_2bytes_data_at(iic, FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI));

  if (enables->pre_range)
  {
    timeouts->final_range_mclks -= timeouts->pre_range_mclks;
  }

  timeouts->final_range_us =
    timeoutMclksToMicroseconds(timeouts->final_range_mclks,
                               timeouts->final_range_vcsel_period_pclks);
} 

uint32_t timeoutMicrosecondsToMclks(uint32_t timeout_period_us, uint8_t vcsel_period_pclks)
{
  uint32_t macro_period_ns = calcMacroPeriod(vcsel_period_pclks);

  return (((timeout_period_us * 1000) + (macro_period_ns / 2)) / macro_period_ns);
}

uint16_t encodeTimeout(uint16_t timeout_mclks)
{
  // format: "(LSByte * 2^MSByte) + 1"

  uint32_t ls_byte = 0;
  uint16_t ms_byte = 0;

  if (timeout_mclks > 0)
  {
    ls_byte = timeout_mclks - 1;

    while ((ls_byte & 0xFFFFFF00) > 0)
    {
      ls_byte >>= 1;
      ms_byte++;
    }

    return (ms_byte << 8) | (ls_byte & 0xFF);
  }
  else { return 0; }
} 
 
uint32_t getMeasurementTimingBudget(Soft_I2C_Typedef *iic)
{
  SequenceStepEnables enables;
  SequenceStepTimeouts timeouts;

  uint16_t const StartOverhead     = 1910; // note that this is different than the value in set_
  uint16_t const EndOverhead        = 960;
  uint16_t const MsrcOverhead       = 660;
  uint16_t const TccOverhead        = 590;
  uint16_t const DssOverhead        = 690;
  uint16_t const PreRangeOverhead   = 660;
  uint16_t const FinalRangeOverhead = 550;

  // "Start and end overhead times always present"
  uint32_t budget_us = StartOverhead + EndOverhead;

  getSequenceStepEnables(iic, &enables);
  getSequenceStepTimeouts(iic, &enables, &timeouts);

  if (enables.tcc)
  {
    budget_us += (timeouts.msrc_dss_tcc_us + TccOverhead);
  }

  if (enables.dss)
  {
    budget_us += 2 * (timeouts.msrc_dss_tcc_us + DssOverhead);
  }
  else if (enables.msrc)
  {
    budget_us += (timeouts.msrc_dss_tcc_us + MsrcOverhead);
  }

  if (enables.pre_range)
  {
    budget_us += (timeouts.pre_range_us + PreRangeOverhead);
  }

  if (enables.final_range)
  {
    budget_us += (timeouts.final_range_us + FinalRangeOverhead);
  }

  measurement_timing_budget_us = budget_us; // store for internal reuse
  return budget_us;
} 
 
bool setMeasurementTimingBudget(Soft_I2C_Typedef *iic, uint32_t budget_us)
{
  SequenceStepEnables enables;
  SequenceStepTimeouts timeouts;

  uint16_t const StartOverhead      = 1320; // note that this is different than the value in get_
  uint16_t const EndOverhead        = 960;
  uint16_t const MsrcOverhead       = 660;
  uint16_t const TccOverhead        = 590;
  uint16_t const DssOverhead        = 690;
  uint16_t const PreRangeOverhead   = 660;
  uint16_t const FinalRangeOverhead = 550;

  uint32_t const MinTimingBudget = 20000;

  if (budget_us < MinTimingBudget) { return false; }

  uint32_t used_budget_us = StartOverhead + EndOverhead;

  getSequenceStepEnables(iic, &enables);
  getSequenceStepTimeouts(iic, &enables, &timeouts);

  if (enables.tcc)
  {
    used_budget_us += (timeouts.msrc_dss_tcc_us + TccOverhead);
  }

  if (enables.dss)
  {
    used_budget_us += 2 * (timeouts.msrc_dss_tcc_us + DssOverhead);
  }
  else if (enables.msrc)
  {
    used_budget_us += (timeouts.msrc_dss_tcc_us + MsrcOverhead);
  }

  if (enables.pre_range)
  {
    used_budget_us += (timeouts.pre_range_us + PreRangeOverhead);
  }

  if (enables.final_range)
  {
    used_budget_us += FinalRangeOverhead;

    // "Note that the final range timeout is determined by the timing
    // budget and the sum of all other timeouts within the sequence.
    // If there is no room for the final range timeout, then an error
    // will be set. Otherwise the remaining time will be applied to
    // the final range."

    if (used_budget_us > budget_us)
    {
      // "Requested timeout too big."
      return false;
    }

    uint32_t final_range_timeout_us = budget_us - used_budget_us;

    // set_sequence_step_timeout() begin
    // (SequenceStepId == VL53L0X_SEQUENCESTEP_FINAL_RANGE)

    // "For the final range timeout, the pre-range timeout
    //  must be added. To do this both final and pre-range
    //  timeouts must be expressed in macro periods MClks
    //  because they have different vcsel periods."

    uint16_t final_range_timeout_mclks =
      timeoutMicrosecondsToMclks(final_range_timeout_us,
                                 timeouts.final_range_vcsel_period_pclks);

    if (enables.pre_range)
    {
      final_range_timeout_mclks += timeouts.pre_range_mclks;
    }

    vl_write_2bytes_data_at(iic, FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI,
      encodeTimeout(final_range_timeout_mclks));

    // set_sequence_step_timeout() end

    measurement_timing_budget_us = budget_us; // store for internal reuse
  }
  return true;
} 


bool performSingleRefCalibration(Soft_I2C_Typedef *iic, uint8_t vhv_init_byte)
{
  vl_write_byte_data_at(iic, SYSRANGE_START, 0x01 | vhv_init_byte); // VL53L0X_REG_SYSRANGE_MODE_START_STOP

  startTimeout();
  while ((vl_read_byte_data_at(iic, RESULT_INTERRUPT_STATUS) & 0x07) == 0)
  {
    if (checkTimeoutExpired()) { return false; }
  }

  vl_write_byte_data_at(iic, SYSTEM_INTERRUPT_CLEAR, 0x01);

  vl_write_byte_data_at(iic, SYSRANGE_START, 0x00);

  return true;
}


bool setVcselPulsePeriod(Soft_I2C_Typedef *iic, vcselPeriodType type, uint8_t period_pclks)
{
  uint8_t vcsel_period_reg = encodeVcselPeriod(period_pclks);

  SequenceStepEnables enables;
  SequenceStepTimeouts timeouts;

  getSequenceStepEnables(iic, &enables);
  getSequenceStepTimeouts(iic, &enables, &timeouts);

  // "Apply specific settings for the requested clock period"
  // "Re-calculate and apply timeouts, in macro periods"

  // "When the VCSEL period for the pre or final range is changed,
  // the corresponding timeout must be read from the device using
  // the current VCSEL period, then the new VCSEL period can be
  // applied. The timeout then must be written back to the device
  // using the new VCSEL period.
  //
  // For the MSRC timeout, the same applies - this timeout being
  // dependant on the pre-range vcsel period."


  if (type == VcselPeriodPreRange)
  {
    // "Set phase check limits"
    switch (period_pclks)
    {
      case 12:
        vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x18);
        break;

      case 14:
        vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x30);
        break;

      case 16:
        vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x40);
        break;

      case 18:
        vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x50);
        break;

      default:
        // invalid period
        return false;
    }
    vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VALID_PHASE_LOW, 0x08);

    // apply new VCSEL period
    vl_write_byte_data_at(iic,PRE_RANGE_CONFIG_VCSEL_PERIOD, vcsel_period_reg);

    // update timeouts

    // set_sequence_step_timeout() begin
    // (SequenceStepId == VL53L0X_SEQUENCESTEP_PRE_RANGE)

    uint16_t new_pre_range_timeout_mclks =
      timeoutMicrosecondsToMclks(timeouts.pre_range_us, period_pclks);

    vl_write_2bytes_data_at(iic, PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI,
      encodeTimeout(new_pre_range_timeout_mclks));

    // set_sequence_step_timeout() end

    // set_sequence_step_timeout() begin
    // (SequenceStepId == VL53L0X_SEQUENCESTEP_MSRC)

    uint16_t new_msrc_timeout_mclks =
      timeoutMicrosecondsToMclks(timeouts.msrc_dss_tcc_us, period_pclks);

    vl_write_byte_data_at(iic,MSRC_CONFIG_TIMEOUT_MACROP,
      (new_msrc_timeout_mclks > 256) ? 255 : (new_msrc_timeout_mclks - 1));

    // set_sequence_step_timeout() end
  }
  else if (type == VcselPeriodFinalRange)
  {
    switch (period_pclks)
    {
      case 8:
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x10);
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_LOW,  0x08);
        vl_write_byte_data_at(iic,GLOBAL_CONFIG_VCSEL_WIDTH, 0x02);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_CONFIG_TIMEOUT, 0x0C);
        vl_write_byte_data_at(iic,0xFF, 0x01);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_LIM, 0x30);
        vl_write_byte_data_at(iic,0xFF, 0x00);
        break;

      case 10:
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x28);
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_LOW,  0x08);
        vl_write_byte_data_at(iic,GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_CONFIG_TIMEOUT, 0x09);
        vl_write_byte_data_at(iic,0xFF, 0x01);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_LIM, 0x20);
        vl_write_byte_data_at(iic,0xFF, 0x00);
        break;

      case 12:
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x38);
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_LOW,  0x08);
        vl_write_byte_data_at(iic,GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_CONFIG_TIMEOUT, 0x08);
        vl_write_byte_data_at(iic,0xFF, 0x01);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_LIM, 0x20);
        vl_write_byte_data_at(iic,0xFF, 0x00);
        break;

      case 14:
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x48);
        vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VALID_PHASE_LOW,  0x08);
        vl_write_byte_data_at(iic,GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_CONFIG_TIMEOUT, 0x07);
        vl_write_byte_data_at(iic,0xFF, 0x01);
        vl_write_byte_data_at(iic,ALGO_PHASECAL_LIM, 0x20);
        vl_write_byte_data_at(iic,0xFF, 0x00);
        break;

      default:
        // invalid period
        return false;
    }

    // apply new VCSEL period
    vl_write_byte_data_at(iic,FINAL_RANGE_CONFIG_VCSEL_PERIOD, vcsel_period_reg);

    // update timeouts

    // set_sequence_step_timeout() begin
    // (SequenceStepId == VL53L0X_SEQUENCESTEP_FINAL_RANGE)

    // "For the final range timeout, the pre-range timeout
    //  must be added. To do this both final and pre-range
    //  timeouts must be expressed in macro periods MClks
    //  because they have different vcsel periods."

    uint16_t new_final_range_timeout_mclks =
      timeoutMicrosecondsToMclks(timeouts.final_range_us, period_pclks);

    if (enables.pre_range)
    {
      new_final_range_timeout_mclks += timeouts.pre_range_mclks;
    }

    vl_write_2bytes_data_at(iic, FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI,
      encodeTimeout(new_final_range_timeout_mclks));

    // set_sequence_step_timeout end
  }
  else
  {
    // invalid type
    return false;
  }

  // "Finally, the timing budget must be re-applied"

  setMeasurementTimingBudget(iic, measurement_timing_budget_us);

  // "Perform the phase calibration. This is needed after changing on vcsel period."
  // VL53L0X_perform_phase_calibration() begin

  uint8_t sequence_config = vl_read_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG);
  vl_write_byte_data_at(iic,SYSTEM_SEQUENCE_CONFIG, 0x02);
  performSingleRefCalibration(iic, 0x0);
  vl_write_byte_data_at(iic,SYSTEM_SEQUENCE_CONFIG, sequence_config);

  // VL53L0X_perform_phase_calibration() end

  return true;
  
}


void vl_default_mode(Soft_I2C_Typedef *iic)
{
  ////////////////// default mode 1.2米测距/////////////////////
  setSignalRateLimit(iic, 0.25);
  setVcselPulsePeriod(iic, VcselPeriodPreRange, 14);
  setVcselPulsePeriod(iic, VcselPeriodFinalRange, 10);	
}


void vl_long_mode(Soft_I2C_Typedef *iic)
{
  ////////////////// long mode 2米测距/////////////////////
  //lower the return signal rate limit (default is 0.25 MCPS)
  setSignalRateLimit(iic, 0.1);
  // increase laser pulse periods (defaults are 14 and 10 PCLKs)
  setVcselPulsePeriod(iic, VcselPeriodPreRange, 18);
  setVcselPulsePeriod(iic, VcselPeriodFinalRange, 14);	
}


void vl_init(Soft_I2C_Typedef *iic,uint8_t which)
{

if(vl_initflag[which] == 0)
  {	  
  vl_initflag[which] = 1;
  // "Set I2C standard mode"
  vl_write_byte_data_at(iic, 0x88, 0x00);

  vl_write_byte_data_at(iic, 0x80, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x00);
  stop_variable = vl_read_byte_data_at(iic, 0x91);
  vl_write_byte_data_at(iic, 0x00, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x80, 0x00);

  // disable SIGNAL_RATE_MSRC (bit 1) and SIGNAL_RATE_PRE_RANGE (bit 4) limit checks
  vl_write_byte_data_at(iic, MSRC_CONFIG_CONTROL, vl_read_byte_data_at(iic, MSRC_CONFIG_CONTROL) | 0x12);

  // set final range signal rate limit to 0.25 MCPS (million counts per second)
  setSignalRateLimit(iic, 0.25);

  vl_write_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG, 0xFF);

  // VL53L0X_DataInit() end

  // VL53L0X_StaticInit() begin

  

  uint8_t spad_count;
  bool spad_type_is_aperture;
  if (!getSpadInfo(iic, &spad_count, &spad_type_is_aperture)) { return false; }


  // The SPAD map (RefGoodSpadMap) is read by VL53L0X_get_info_from_device() in
  // the API, but the same data seems to be more easily readable from
  // GLOBAL_CONFIG_SPAD_ENABLES_REF_0 through _6, so read it from there
  uint8_t ref_spad_map[6];
  vl_read_block_data_at(iic, GLOBAL_CONFIG_SPAD_ENABLES_REF_0, 6, ref_spad_map);

  // -- VL53L0X_set_reference_spads() begin (assume NVM values are valid)

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, DYNAMIC_SPAD_REF_EN_START_OFFSET, 0x00);
  vl_write_byte_data_at(iic, DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD, 0x2C);
  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, GLOBAL_CONFIG_REF_EN_START_SELECT, 0xB4);

  uint8_t first_spad_to_enable = spad_type_is_aperture ? 12 : 0; // 12 is the first aperture spad
  uint8_t spads_enabled = 0;
  uint8_t i;
  for (i = 0; i < 48; i++)
  {
    if (i < first_spad_to_enable || spads_enabled == spad_count)
    {
      // This bit is lower than the first one that should be enabled, or
      // (reference_spad_count) bits have already been enabled, so zero this bit
      ref_spad_map[i / 8] &= ~(1 << (i % 8));
    }
    else if ((ref_spad_map[i / 8] >> (i % 8)) & 0x1)
    {
      spads_enabled++;
    }
  }

  vl_writeMulti_at(iic, GLOBAL_CONFIG_SPAD_ENABLES_REF_0, ref_spad_map, 6);

  // -- VL53L0X_set_reference_spads() end

  // -- VL53L0X_load_tuning_settings() begin
  // DefaultTuningSettings from vl53l0x_tuning.h

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x00);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x09, 0x00);
  vl_write_byte_data_at(iic, 0x10, 0x00);
  vl_write_byte_data_at(iic, 0x11, 0x00);

  vl_write_byte_data_at(iic, 0x24, 0x01);
  vl_write_byte_data_at(iic, 0x25, 0xFF);
  vl_write_byte_data_at(iic, 0x75, 0x00);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x4E, 0x2C);
  vl_write_byte_data_at(iic, 0x48, 0x00);
  vl_write_byte_data_at(iic, 0x30, 0x20);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x30, 0x09);
  vl_write_byte_data_at(iic, 0x54, 0x00);
  vl_write_byte_data_at(iic, 0x31, 0x04);
  vl_write_byte_data_at(iic, 0x32, 0x03);
  vl_write_byte_data_at(iic, 0x40, 0x83);
  vl_write_byte_data_at(iic, 0x46, 0x25);
  vl_write_byte_data_at(iic, 0x60, 0x00);
  vl_write_byte_data_at(iic, 0x27, 0x00);
  vl_write_byte_data_at(iic, 0x50, 0x06);
  vl_write_byte_data_at(iic, 0x51, 0x00);
  vl_write_byte_data_at(iic, 0x52, 0x96);
  vl_write_byte_data_at(iic, 0x56, 0x08);
  vl_write_byte_data_at(iic, 0x57, 0x30);
  vl_write_byte_data_at(iic, 0x61, 0x00);
  vl_write_byte_data_at(iic, 0x62, 0x00);
  vl_write_byte_data_at(iic, 0x64, 0x00);
  vl_write_byte_data_at(iic, 0x65, 0x00);
  vl_write_byte_data_at(iic, 0x66, 0xA0);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x22, 0x32);
  vl_write_byte_data_at(iic, 0x47, 0x14);
  vl_write_byte_data_at(iic, 0x49, 0xFF);
  vl_write_byte_data_at(iic, 0x4A, 0x00);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x7A, 0x0A);
  vl_write_byte_data_at(iic, 0x7B, 0x00);
  vl_write_byte_data_at(iic, 0x78, 0x21);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x23, 0x34);
  vl_write_byte_data_at(iic, 0x42, 0x00);
  vl_write_byte_data_at(iic, 0x44, 0xFF);
  vl_write_byte_data_at(iic, 0x45, 0x26);
  vl_write_byte_data_at(iic, 0x46, 0x05);
  vl_write_byte_data_at(iic, 0x40, 0x40);
  vl_write_byte_data_at(iic, 0x0E, 0x06);
  vl_write_byte_data_at(iic, 0x20, 0x1A);
  vl_write_byte_data_at(iic, 0x43, 0x40);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x34, 0x03);
  vl_write_byte_data_at(iic, 0x35, 0x44);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x31, 0x04);
  vl_write_byte_data_at(iic, 0x4B, 0x09);
  vl_write_byte_data_at(iic, 0x4C, 0x05);
  vl_write_byte_data_at(iic, 0x4D, 0x04);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x44, 0x00);
  vl_write_byte_data_at(iic, 0x45, 0x20);
  vl_write_byte_data_at(iic, 0x47, 0x08);
  vl_write_byte_data_at(iic, 0x48, 0x28);
  vl_write_byte_data_at(iic, 0x67, 0x00);
  vl_write_byte_data_at(iic, 0x70, 0x04);
  vl_write_byte_data_at(iic, 0x71, 0x01);
  vl_write_byte_data_at(iic, 0x72, 0xFE);
  vl_write_byte_data_at(iic, 0x76, 0x00);
  vl_write_byte_data_at(iic, 0x77, 0x00);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x0D, 0x01);

  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x80, 0x01);
  vl_write_byte_data_at(iic, 0x01, 0xF8);

  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x8E, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x80, 0x00);

  // -- VL53L0X_load_tuning_settings() end

  // "Set interrupt config to new sample ready"
  // -- VL53L0X_SetGpioConfig() begin

  vl_write_byte_data_at(iic, SYSTEM_INTERRUPT_CONFIG_GPIO, 0x04);
  vl_write_byte_data_at(iic, GPIO_HV_MUX_ACTIVE_HIGH, vl_read_byte_data_at(iic, GPIO_HV_MUX_ACTIVE_HIGH) & ~0x10); // active low
  vl_write_byte_data_at(iic, SYSTEM_INTERRUPT_CLEAR, 0x01);

  // -- VL53L0X_SetGpioConfig() end

   

  
  ////////////////////////
  
  measurement_timing_budget_us = getMeasurementTimingBudget(iic);

  // "Disable MSRC and TCC by default"
  // MSRC = Minimum Signal Rate Check
  // TCC = Target CentreCheck
  // -- VL53L0X_SetSequenceStepEnable() begin

  vl_write_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG, 0xE8);

  // -- VL53L0X_SetSequenceStepEnable() end

  // "Recalculate timing budget"
  setMeasurementTimingBudget(iic, measurement_timing_budget_us);

  // VL53L0X_StaticInit() end
  
  

  
  
  // VL53L0X_PerformRefCalibration() begin (VL53L0X_perform_ref_calibration())

  // -- VL53L0X_perform_vhv_calibration() begin

  vl_write_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG, 0x01);
  if (!performSingleRefCalibration(iic, 0x40)) { return false; }

  // -- VL53L0X_perform_vhv_calibration() end

  // -- VL53L0X_perform_phase_calibration() begin

  vl_write_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG, 0x02);
  if (!performSingleRefCalibration(iic, 0x00)) { return false; }

  // -- VL53L0X_perform_phase_calibration() end

  // "restore the previous Sequence Config"
  vl_write_byte_data_at(iic, SYSTEM_SEQUENCE_CONFIG, 0xE8);

  // VL53L0X_PerformRefCalibration() end

  } 
}

uint16_t vl_result(Soft_I2C_Typedef *iic)
{
  uint16_t dist = 0;	
  vl_write_byte_data_at(iic, 0x80, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x01);
  vl_write_byte_data_at(iic, 0x00, 0x00);
  vl_write_byte_data_at(iic, 0x91, stop_variable);
  vl_write_byte_data_at(iic, 0x00, 0x01);
  vl_write_byte_data_at(iic, 0xFF, 0x00);
  vl_write_byte_data_at(iic, 0x80, 0x00); 
  

  
  
  
  vl_write_byte_data_at(iic, SYSRANGE_START, 0x01);//start ranging. VL53L0X_REG_SYSRANGE_START=0x00
  
  
  startTimeout();
  while (vl_read_byte_data_at(iic,SYSRANGE_START) & 0x01)
  {
    if (checkTimeoutExpired())
    {
      did_timeout = true;
      return 65535;
    }
  }  

  
  

	
	// startTimeout();
  // while ((vl_read_byte_data_at(iic,RESULT_INTERRUPT_STATUS) & 0x07) == 0)//卡住的时候vl_read_byte_data_at读出是64，RESULT_INTERRUPT_STATUS=0x13
  // {
  //   if (checkTimeoutExpired())
  //   {
  //     did_timeout = true;
  //     return 65535;
  //   }
  // }
	
	
      vl_read_block_data_at(iic, RESULT_RANGE_STATUS, 12, gbuf);
	  vl_write_byte_data_at(iic, SYSTEM_INTERRUPT_CLEAR, 0x01);
	  
	  dist = makeuint16(gbuf[11], gbuf[10]);

	  return dist;
   
}

   
#endif
